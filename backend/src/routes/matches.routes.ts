import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';
import { sendRoomCredentialsEmail } from '../services/mailer';

const router = Router();

const configureCredentialsSchema = z.object({
  match_id: z.string().uuid(),
  room_id: z.string().min(2).max(100),
  room_password: z.string().min(2).max(100),
  scheduled_time: z.string().optional(),
});

// GET /api/matches/my-room (Eligible Captain's Room Credentials)
router.get('/my-room', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Retrieve matches for tournaments where current user is captain of a CONFIRMED squad
    const roomsRes = await pool.query(
      `SELECT m.id as match_id, m.match_number, m.scheduled_time, m.status as match_status,
              m.credentials_released, m.credentials_released_at,
              t.id as tournament_id, t.title as tournament_title, t.game_mode, t.map_name,
              s.name as squad_name, r.slot_number,
              CASE WHEN m.credentials_released = TRUE THEN prc.room_id ELSE NULL END as room_id,
              CASE WHEN m.credentials_released = TRUE THEN prc.room_password ELSE NULL END as room_password
       FROM registrations r
       JOIN tournaments t ON r.tournament_id = t.id
       JOIN matches m ON t.id = m.tournament_id
       JOIN squads s ON r.squad_id = s.id
       LEFT JOIN protected_room_credentials prc ON m.id = prc.match_id
       WHERE r.captain_id = $1 AND r.status = 'Confirmed'
       ORDER BY m.scheduled_time ASC`,
      [req.user!.id]
    );

    res.json({ rooms: roomsRes.rows });
  } catch (err: any) {
    console.error('[Get My Room Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve match room information.' });
  }
});

// GET /api/matches/admin/all (Admin View Matches & Credential Status)
router.get('/admin/all', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const matchesRes = await pool.query(
      `SELECT m.*,
              t.title as tournament_title, t.status as tournament_status,
              prc.room_id, prc.room_password, prc.release_state, prc.release_initiated_at,
              COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'Confirmed') as eligible_captains_count,
              COUNT(edl.id) FILTER (WHERE edl.status = 'Sent') as emails_sent_count,
              COUNT(edl.id) FILTER (WHERE edl.status = 'Failed') as emails_failed_count
       FROM matches m
       JOIN tournaments t ON m.tournament_id = t.id
       LEFT JOIN protected_room_credentials prc ON m.id = prc.match_id
       LEFT JOIN registrations r ON t.id = r.tournament_id
       LEFT JOIN email_delivery_logs edl ON m.id = edl.match_id
       GROUP BY m.id, t.id, prc.id
       ORDER BY m.scheduled_time ASC`
    );

    res.json({ matches: matchesRes.rows });
  } catch (err: any) {
    console.error('[Admin Matches Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve matches.' });
  }
});

// POST /api/matches/admin/credentials (Configure Room Credentials)
router.post('/admin/credentials', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = configureCredentialsSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Room ID and Room Password are required.' });
      return;
    }

    const { match_id, room_id, room_password, scheduled_time } = parse.data;

    // Verify match exists
    const matchRes = await pool.query('SELECT tournament_id FROM matches WHERE id = $1', [match_id]);
    if (matchRes.rows.length === 0) {
      res.status(404).json({ error: 'Match does not exist.' });
      return;
    }

    const tournamentId = matchRes.rows[0].tournament_id;

    // If admin adjusted scheduled match time, synchronize match and tournament tables
    if (scheduled_time) {
      const parsedTime = new Date(scheduled_time);
      if (!isNaN(parsedTime.getTime())) {
        await pool.query(
          'UPDATE matches SET scheduled_time = $1, updated_at = NOW() WHERE id = $2',
          [parsedTime, match_id]
        );
        await pool.query(
          'UPDATE tournaments SET match_time = $1, updated_at = NOW() WHERE id = $2',
          [parsedTime, tournamentId]
        );
      }
    }

    // Upsert protected credentials
    await pool.query(
      `INSERT INTO protected_room_credentials (
        match_id, tournament_id, room_id, room_password, release_state
      ) VALUES ($1, $2, $3, $4, 'Configured')
      ON CONFLICT (match_id) DO UPDATE
      SET room_id = EXCLUDED.room_id,
          room_password = EXCLUDED.room_password,
          release_state = 'Configured',
          updated_at = NOW()`,
      [match_id, tournamentId, room_id.trim(), room_password.trim()]
    );

    await recordAuditLog({
      actorId: req.user!.id,
      action: 'CONFIGURE_ROOM_CREDENTIALS',
      targetEntity: 'protected_room_credentials',
      targetId: match_id,
      metadata: { match_id, tournamentId },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Custom room credentials saved successfully.' });
  } catch (err: any) {
    console.error('[Configure Room Error]:', err);
    res.status(500).json({ error: 'Failed to configure room credentials.' });
  }
});

// GET /api/matches/admin/:matchId/eligible-captains (Recipient Count Inspection Modal)
router.get('/admin/:matchId/eligible-captains', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;

    const matchRes = await pool.query(
      `SELECT m.id, m.scheduled_time, t.id as tournament_id, t.title as tournament_title,
              prc.room_id, prc.room_password, prc.release_state
       FROM matches m
       JOIN tournaments t ON m.tournament_id = t.id
       LEFT JOIN protected_room_credentials prc ON m.id = prc.match_id
       WHERE m.id = $1`,
      [matchId]
    );

    if (matchRes.rows.length === 0) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    const match = matchRes.rows[0];

    // Find eligible confirmed squad captains
    const eligibleRes = await pool.query(
      `SELECT r.id as registration_id, r.slot_number,
              s.name as squad_name,
              u.id as captain_id, u.display_name as captain_name, u.email as captain_email, u.phone as captain_phone,
              u.is_suspended
       FROM registrations r
       JOIN squads s ON r.squad_id = s.id
       JOIN users u ON r.captain_id = u.id
       WHERE r.tournament_id = $1 AND r.status = 'Confirmed' AND u.is_suspended = FALSE
       ORDER BY r.slot_number ASC NULLS LAST`,
      [match.tournament_id]
    );

    res.json({
      match,
      has_credentials: Boolean(match.room_id && match.room_password),
      eligible_count: eligibleRes.rows.length,
      captains: eligibleRes.rows,
    });
  } catch (err: any) {
    console.error('[Get Eligible Captains Error]:', err);
    res.status(500).json({ error: 'Failed to inspect eligible captains.' });
  }
});

// POST /api/matches/admin/:matchId/send-credentials (Manual Admin Click to Send)
router.post('/admin/:matchId/send-credentials', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;

    const matchRes = await pool.query(
      `SELECT m.id, m.scheduled_time, t.id as tournament_id, t.title as tournament_title,
              prc.room_id, prc.room_password
       FROM matches m
       JOIN tournaments t ON m.tournament_id = t.id
       JOIN protected_room_credentials prc ON m.id = prc.match_id
       WHERE m.id = $1`,
      [matchId]
    );

    if (matchRes.rows.length === 0) {
      res.status(400).json({ error: 'Room credentials have not been configured for this match yet.' });
      return;
    }

    const match = matchRes.rows[0];

    // Enforce Rule: Credentials can only be dispatched manually during the final 10 minutes before the match
    const scheduledTimeMs = new Date(match.scheduled_time).getTime();
    const nowMs = Date.now();
    const diffMs = scheduledTimeMs - nowMs;

    if (diffMs > 10 * 60 * 1000) {
      const minutesLeft = Math.ceil(diffMs / (60 * 1000));
      res.status(400).json({
        error: `Match credentials can only be sent during the final 10 minutes before the match (T-10m window). Current match begins in ~${minutesLeft} minutes.`,
      });
      return;
    }

    // Fetch eligible confirmed squad captains with assigned slot numbers
    const eligibleRes = await pool.query(
      `SELECT r.id as registration_id, r.slot_number, s.name as squad_name,
              u.id as captain_id, u.email as captain_email
       FROM registrations r
       JOIN squads s ON r.squad_id = s.id
       JOIN users u ON r.captain_id = u.id
       WHERE r.tournament_id = $1 AND r.status = 'Confirmed' AND u.is_suspended = FALSE`,
      [match.tournament_id]
    );

    const eligibleCaptains = eligibleRes.rows;
    if (eligibleCaptains.length === 0) {
      res.status(400).json({ error: 'No eligible confirmed squads found for this tournament. Emails cannot be dispatched.' });
      return;
    }

    let successfulCount = 0;
    let failedCount = 0;
    const matchTimeFormatted = new Date(match.scheduled_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Send emails and record delivery log per recipient
    for (const captain of eligibleCaptains) {
      try {
        const mailResult = await sendRoomCredentialsEmail(
          captain.captain_email,
          match.tournament_title,
          match.room_id,
          match.room_password,
          `${matchTimeFormatted} IST`,
          captain.slot_number
        );

        const status = mailResult.success ? 'Sent' : 'Failed';
        if (mailResult.success) {
          successfulCount++;
        } else {
          failedCount++;
        }

        // Record in email_delivery_logs
        await pool.query(
          `INSERT INTO email_delivery_logs (
            recipient_email, recipient_id, tournament_id, match_id, email_type, status, error_message, sent_at
          ) VALUES ($1, $2, $3, $4, 'ROOM_CREDENTIALS', $5, $6, $7)`,
          [
            captain.captain_email,
            captain.captain_id,
            match.tournament_id,
            match.id,
            status,
            mailResult.error || null,
            mailResult.success ? new Date() : null,
          ]
        );

        // Also insert in-app notification
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, 'Match Credentials Released!', $2, 'Match', '/player/match-room')`,
          [
            captain.captain_id,
            `Custom room details for "${match.tournament_title}" are now available. You are assigned to Slot #${captain.slot_number || 'TBD'}. Join exclusively in your assigned slot.`,
          ]
        );
      } catch (sendErr: any) {
        failedCount++;
        console.error(`[Credential Dispatch Error] ${captain.captain_email}:`, sendErr.message);
      }
    }

    // Update match and protected credentials release state
    await pool.query(
      `UPDATE matches
       SET credentials_released = TRUE, credentials_released_at = NOW()
       WHERE id = $1`,
      [match.id]
    );

    await pool.query(
      `UPDATE protected_room_credentials
       SET release_state = 'Released', release_initiated_by = $1, release_initiated_at = NOW()
       WHERE match_id = $2`,
      [req.user!.id, match.id]
    );

    await recordAuditLog({
      actorId: req.user!.id,
      action: 'RELEASE_ROOM_CREDENTIALS_MANUAL',
      targetEntity: 'matches',
      targetId: match.id,
      metadata: {
        tournament_id: match.tournament_id,
        recipients_count: eligibleCaptains.length,
        successful: successfulCount,
        failed: failedCount,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Match credentials released. ${successfulCount} sent, ${failedCount} failed out of ${eligibleCaptains.length} eligible captains.`,
      stats: {
        total: eligibleCaptains.length,
        successful: successfulCount,
        failed: failedCount,
      },
    });
  } catch (err: any) {
    console.error('[Send Credentials Error]:', err);
    res.status(500).json({ error: 'Failed to release match room credentials.' });
  }
});

export default router;
