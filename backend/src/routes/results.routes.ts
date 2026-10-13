import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';

const router = Router();

const resultItemSchema = z.object({
  squad_id: z.string().uuid(),
  placement: z.number().int().min(1).max(50),
  kills: z.number().int().min(0).default(0),
  points: z.number().int().min(0),
  prize_won: z.number().min(0).default(0),
  is_winner: z.boolean().default(false),
});

const saveResultsSchema = z.object({
  tournament_id: z.string().uuid(),
  results: z.array(resultItemSchema).min(1),
  is_published: z.boolean().default(false),
});

// GET /api/results/public (Published Results for Spectators and Community)
router.get('/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const resultsRes = await pool.query(
      `SELECT tr.*,
              t.title as tournament_title, t.game_mode, t.map_name, t.prize_pool, t.match_time,
              s.name as squad_name
       FROM tournament_results tr
       JOIN tournaments t ON tr.tournament_id = t.id
       JOIN squads s ON tr.squad_id = s.id
       WHERE tr.is_published = TRUE
       ORDER BY t.match_time DESC, tr.placement ASC`
    );

    res.json({ results: resultsRes.rows });
  } catch (err: any) {
    console.error('[Public Results Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve results.' });
  }
});

// GET /api/results/tournament/:tournamentId (Results for specific tournament)
router.get('/tournament/:tournamentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId } = req.params;
    const isAdmin = req.user?.roles.includes('Admin');

    let queryText = `
      SELECT tr.*,
             s.name as squad_name,
             u.display_name as captain_name
      FROM tournament_results tr
      JOIN squads s ON tr.squad_id = s.id
      JOIN users u ON s.captain_id = u.id
      WHERE tr.tournament_id = $1
    `;

    if (!isAdmin) {
      queryText += ` AND tr.is_published = TRUE`;
    }

    queryText += ` ORDER BY tr.placement ASC`;

    const resResults = await pool.query(queryText, [tournamentId]);
    res.json({ results: resResults.rows });
  } catch (err: any) {
    console.error('[Tournament Results Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve tournament results.' });
  }
});

// GET /api/results/my (Player's own tournament results)
router.get('/my', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const myResults = await pool.query(
      `SELECT tr.*,
              t.title as tournament_title, t.game_mode, t.match_time,
              s.name as squad_name
       FROM tournament_results tr
       JOIN tournaments t ON tr.tournament_id = t.id
       JOIN squads s ON tr.squad_id = s.id
       WHERE s.captain_id = $1 AND tr.is_published = TRUE
       ORDER BY t.match_time DESC`,
      [req.user!.id]
    );

    res.json({ results: myResults.rows });
  } catch (err: any) {
    console.error('[My Results Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve your results.' });
  }
});

// POST /api/results/admin/save (Admin Save/Update Results)
router.post('/admin/save', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = saveResultsSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid results submission.', details: parse.error.format() });
      return;
    }

    const { tournament_id, results, is_published } = parse.data;

    await withTransaction(async (client) => {
      // Validate all squads are actually registered for this tournament
      for (const item of results) {
        const regCheck = await client.query(
          `SELECT id FROM registrations WHERE tournament_id = $1 AND squad_id = $2`,
          [tournament_id, item.squad_id]
        );
        if (regCheck.rows.length === 0) {
          throw { statusCode: 400, message: `Squad ${item.squad_id} is not registered in this tournament.` };
        }
      }

      // Upsert each result
      for (const item of results) {
        await client.query(
          `INSERT INTO tournament_results (
            tournament_id, squad_id, placement, kills, points, prize_won, is_winner, is_published, published_by, published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (tournament_id, squad_id) DO UPDATE
          SET placement = EXCLUDED.placement,
              kills = EXCLUDED.kills,
              points = EXCLUDED.points,
              prize_won = EXCLUDED.prize_won,
              is_winner = EXCLUDED.is_winner,
              is_published = EXCLUDED.is_published,
              published_by = EXCLUDED.published_by,
              published_at = EXCLUDED.published_at,
              updated_at = NOW()`,
          [
            tournament_id,
            item.squad_id,
            item.placement,
            item.kills,
            item.points,
            item.prize_won,
            item.is_winner,
            is_published,
            is_published ? req.user!.id : null,
            is_published ? new Date() : null,
          ]
        );
      }

      if (is_published) {
        // Update tournament status to Completed
        await client.query(`UPDATE tournaments SET status = 'Completed', updated_at = NOW() WHERE id = $1`, [
          tournament_id,
        ]);
      }

      await recordAuditLog({
        actorId: req.user!.id,
        action: is_published ? 'PUBLISH_TOURNAMENT_RESULTS' : 'SAVE_DRAFT_RESULTS',
        targetEntity: 'tournament_results',
        targetId: tournament_id,
        metadata: { squadCount: results.length, is_published },
        ipAddress: req.ip,
      });
    });

    res.json({ success: true, message: 'Tournament results successfully saved.' });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[Save Results Error]:', err);
    res.status(500).json({ error: 'Failed to record tournament results.' });
  }
});

// PATCH /api/results/admin/:tournamentId/publish (Toggle Published State)
router.patch('/admin/:tournamentId/publish', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId } = req.params;
    const { is_published } = req.body;

    await pool.query(
      `UPDATE tournament_results
       SET is_published = $1,
           published_by = CASE WHEN $1 = TRUE THEN $2 ELSE published_by END,
           published_at = CASE WHEN $1 = TRUE THEN NOW() ELSE published_at END,
           updated_at = NOW()
       WHERE tournament_id = $3`,
      [Boolean(is_published), req.user!.id, tournamentId]
    );

    if (is_published) {
      await pool.query(`UPDATE tournaments SET status = 'Completed' WHERE id = $1`, [tournamentId]);
    }

    await recordAuditLog({
      actorId: req.user!.id,
      action: is_published ? 'PUBLISH_RESULTS' : 'UNPUBLISH_RESULTS',
      targetEntity: 'tournament_results',
      targetId: tournamentId,
      metadata: { is_published },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `Results ${is_published ? 'published' : 'unpublished'}.` });
  } catch (err: any) {
    console.error('[Publish Results Error]:', err);
    res.status(500).json({ error: 'Failed to update result publication status.' });
  }
});

export default router;
