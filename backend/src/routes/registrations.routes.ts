import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';

const router = Router();

const registerSchema = z.object({
  tournament_id: z.string().uuid(),
  squad_id: z.string().uuid(),
});

// POST /api/registrations (Register Squad for Tournament)
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Valid tournament ID and squad ID are required.' });
      return;
    }

    const { tournament_id, squad_id } = parse.data;

    const result = await withTransaction(async (client) => {
      // 1. Fetch tournament details with lock
      const tRes = await client.query(
        `SELECT id, title, entry_fee, max_squads, registration_deadline, status, publication_status
         FROM tournaments
         WHERE id = $1
         FOR UPDATE`,
        [tournament_id]
      );

      if (tRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Tournament does not exist.' };
      }

      const tournament = tRes.rows[0];

      // Check publication & status
      if (tournament.publication_status !== 'Published' || tournament.status !== 'Registration Open') {
        throw { statusCode: 400, message: `Registration is currently closed for this tournament (Status: ${tournament.status}).` };
      }

      // Check deadline
      if (new Date() > new Date(tournament.registration_deadline)) {
        throw { statusCode: 400, message: 'Registration deadline has passed.' };
      }

      // 2. Fetch Squad & verify current user is the Captain
      const squadRes = await client.query(
        `SELECT id, name, captain_id FROM squads WHERE id = $1`,
        [squad_id]
      );

      if (squadRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Squad not found.' };
      }

      if (squadRes.rows[0].captain_id !== req.user!.id) {
        throw { statusCode: 403, message: 'Only the designated Squad Captain can register for tournaments.' };
      }

      // 3. Verify squad has exactly 4 players (1 captain + 3 teammates)
      const countMembersRes = await client.query(
        `SELECT COUNT(*) as member_count FROM squad_members WHERE squad_id = $1`,
        [squad_id]
      );
      const memberCount = parseInt(countMembersRes.rows[0].member_count, 10);
      if (memberCount !== 4) {
        throw {
          statusCode: 400,
          message: `Squad "${squadRes.rows[0].name}" has ${memberCount} members. A full 4-player roster is required to register.`,
        };
      }

      // 4. Check for existing registration
      const existingReg = await client.query(
        `SELECT id, status FROM registrations WHERE tournament_id = $1 AND squad_id = $2`,
        [tournament_id, squad_id]
      );

      if (existingReg.rows.length > 0) {
        const prevStatus = existingReg.rows[0].status;
        if (prevStatus !== 'Cancelled' && prevStatus !== 'Rejected') {
          throw {
            statusCode: 409,
            message: `Your squad is already registered for this tournament (Status: ${prevStatus}).`,
          };
        }
      }

      // 5. Check tournament capacity
      const capacityCheck = await client.query(
        `SELECT COUNT(*) as active_count
         FROM registrations
         WHERE tournament_id = $1 AND status NOT IN ('Cancelled', 'Rejected')`,
        [tournament_id]
      );
      const activeCount = parseInt(capacityCheck.rows[0].active_count, 10);
      if (activeCount >= tournament.max_squads) {
        throw { statusCode: 400, message: 'Tournament has reached maximum squad capacity.' };
      }

      const nextSlot = activeCount + 1;
      const isFree = parseFloat(tournament.entry_fee) === 0;
      const initialStatus = isFree ? 'Confirmed' : 'Pending Payment';

      // 6. Create or re-activate registration
      let regInsert;
      if (existingReg.rows.length > 0) {
        regInsert = await client.query(
          `UPDATE registrations
           SET captain_id = $1, status = $2, slot_number = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [req.user!.id, initialStatus, nextSlot, existingReg.rows[0].id]
        );
      } else {
        regInsert = await client.query(
          `INSERT INTO registrations (tournament_id, squad_id, captain_id, status, slot_number)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [tournament_id, squad_id, req.user!.id, initialStatus, nextSlot]
        );
      }

      // Create notification for Captain
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'Registration', '/player/my-tournaments')`,
        [
          req.user!.id,
          'Tournament Registration Submitted',
          isFree
            ? `Your squad "${squadRes.rows[0].name}" is confirmed for "${tournament.title}". Slot #${nextSlot}.`
            : `Your registration for "${tournament.title}" is pending payment verification. Please submit your UPI UTR reference.`,
        ]
      );

      return {
        registration: regInsert.rows[0],
        entry_fee: tournament.entry_fee,
        requires_payment: !isFree,
      };
    });

    res.status(201).json({
      success: true,
      message: result.requires_payment
        ? 'Registration initiated. Please submit your payment reference.'
        : 'Registration confirmed for free tournament!',
      ...result,
    });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[Registration Error]:', err);
    res.status(500).json({ error: 'Failed to process tournament registration.' });
  }
});

// GET /api/registrations/my (Player's registered tournaments)
router.get('/my', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const regRes = await pool.query(
      `SELECT r.id as registration_id, r.status as registration_status, r.slot_number, r.created_at as registered_at,
              t.id as tournament_id, t.title as tournament_title, t.entry_fee, t.prize_pool, t.map_name, t.match_time,
              t.status as tournament_status,
              s.id as squad_id, s.name as squad_name,
              p.id as payment_id, p.status as payment_status, p.utr, p.amount as payment_amount, p.rejection_reason
       FROM registrations r
       JOIN tournaments t ON r.tournament_id = t.id
       JOIN squads s ON r.squad_id = s.id
       LEFT JOIN payments p ON r.id = p.registration_id
       WHERE r.captain_id = $1
       ORDER BY t.match_time ASC`,
      [req.user!.id]
    );

    res.json({ registrations: regRes.rows });
  } catch (err: any) {
    console.error('[Get My Registrations Error]:', err);
    res.status(500).json({ error: 'Failed to fetch player registrations.' });
  }
});

// GET /api/registrations/admin (Admin list & search registrations)
router.get('/admin', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournament_id, status, search } = req.query;

    let queryText = `
      SELECT r.id as registration_id, r.status, r.slot_number, r.created_at,
             t.id as tournament_id, t.title as tournament_title, t.entry_fee,
             s.id as squad_id, s.name as squad_name,
             u.id as captain_id, u.display_name as captain_name, u.email as captain_email, u.phone as captain_phone,
             p.id as payment_id, p.status as payment_status, p.utr, p.amount
      FROM registrations r
      JOIN tournaments t ON r.tournament_id = t.id
      JOIN squads s ON r.squad_id = s.id
      JOIN users u ON r.captain_id = u.id
      LEFT JOIN payments p ON r.id = p.registration_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tournament_id && typeof tournament_id === 'string') {
      params.push(tournament_id);
      queryText += ` AND r.tournament_id = $${params.length}`;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      params.push(status);
      queryText += ` AND r.status = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      queryText += ` AND (t.title ILIKE $${params.length} OR s.name ILIKE $${params.length} OR u.display_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR p.utr ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY r.created_at DESC`;

    const resReg = await pool.query(queryText, params);
    res.json({ registrations: resReg.rows });
  } catch (err: any) {
    console.error('[Admin Registrations Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve registrations.' });
  }
});

// PATCH /api/registrations/:id/status (Admin change status & slot number)
router.patch('/:id/status', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, slot_number } = req.body;

    const validStatuses = ['Pending Payment', 'Payment Submitted', 'Confirmed', 'Cancelled', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Choose from: ${validStatuses.join(', ')}` });
      return;
    }

    let queryText = 'UPDATE registrations SET updated_at = NOW()';
    const params: any[] = [];

    if (status) {
      params.push(status);
      queryText += `, status = $${params.length}`;
    }

    if (slot_number !== undefined && slot_number !== null) {
      params.push(parseInt(slot_number, 10));
      queryText += `, slot_number = $${params.length}`;
    }

    params.push(id);
    queryText += ` WHERE id = $${params.length} RETURNING *`;

    const regRes = await pool.query(queryText, params);

    if (regRes.rows.length === 0) {
      res.status(404).json({ error: 'Registration not found.' });
      return;
    }

    await recordAuditLog({
      actorId: req.user!.id,
      action: 'UPDATE_REGISTRATION_STATUS',
      targetEntity: 'registrations',
      targetId: id,
      metadata: { newStatus: status, slot_number },
      ipAddress: req.ip,
    });

    res.json({ success: true, registration: regRes.rows[0] });
  } catch (err: any) {
    console.error('[Update Registration Status Error]:', err);
    res.status(500).json({ error: 'Failed to update registration status.' });
  }
});

export default router;
