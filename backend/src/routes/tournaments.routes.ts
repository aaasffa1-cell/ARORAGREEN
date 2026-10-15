import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';

const router = Router();

const tournamentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  game_title: z.string().default('Free Fire'),
  game_mode: z.string().min(2).max(50),
  map_name: z.string().min(2).max(100),
  entry_fee: z.coerce.number().min(0),
  prize_pool: z.coerce.number().min(0),
  max_squads: z.coerce.number().int().min(2).max(100),
  registration_deadline: z.string(),
  match_time: z.string(),
  rules: z.string().optional(),
  status: z.enum([
    'Draft',
    'Published',
    'Registration Open',
    'Registration Closed',
    'Live',
    'Completed',
    'Cancelled',
  ]).default('Draft'),
  publication_status: z.enum(['Draft', 'Published']).default('Draft'),
});

// GET /api/tournaments (Public listing with filtering)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, game_mode, map_name, search } = req.query;

    let queryText = `
      SELECT t.*,
             COUNT(r.id) FILTER (WHERE r.status != 'Cancelled' AND r.status != 'Rejected') AS registered_squads_count,
             COUNT(r.id) FILTER (WHERE r.status = 'Confirmed') AS confirmed_squads_count
      FROM tournaments t
      LEFT JOIN registrations r ON t.id = r.tournament_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Unless admin, show only published/visible tournaments
    const isAdmin = req.user?.roles.includes('Admin');
    if (!isAdmin) {
      queryText += ` AND t.publication_status = 'Published'`;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      params.push(status);
      queryText += ` AND t.status = $${params.length}`;
    }

    if (game_mode && typeof game_mode === 'string' && game_mode !== 'all') {
      params.push(game_mode);
      queryText += ` AND t.game_mode = $${params.length}`;
    }

    if (map_name && typeof map_name === 'string' && map_name !== 'all') {
      params.push(map_name);
      queryText += ` AND t.map_name = $${params.length}`;
    }

    if (search && typeof search === 'string') {
      params.push(`%${search}%`);
      queryText += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    queryText += ` GROUP BY t.id ORDER BY t.match_time ASC`;

    const result = await pool.query(queryText, params);
    res.json({ tournaments: result.rows });
  } catch (err: any) {
    console.error('[Get Tournaments Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve tournaments.' });
  }
});

// GET /api/tournaments/:id (Details)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const tRes = await pool.query(
      `SELECT t.*,
              COUNT(r.id) FILTER (WHERE r.status != 'Cancelled' AND r.status != 'Rejected') AS registered_squads_count,
              COUNT(r.id) FILTER (WHERE r.status = 'Confirmed') AS confirmed_squads_count
       FROM tournaments t
       LEFT JOIN registrations r ON t.id = r.tournament_id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );

    if (tRes.rows.length === 0) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    const tournament = tRes.rows[0];

    // Get matches
    const matchesRes = await pool.query(
      `SELECT id, match_number, scheduled_time, status, credentials_released, credentials_released_at
       FROM matches
       WHERE tournament_id = $1
       ORDER BY match_number ASC`,
      [id]
    );

    // Get confirmed squads list
    const squadsRes = await pool.query(
      `SELECT r.id as registration_id, r.status, r.slot_number,
              s.id as squad_id, s.name as squad_name,
              u.display_name as captain_name
       FROM registrations r
       JOIN squads s ON r.squad_id = s.id
       JOIN users u ON r.captain_id = u.id
       WHERE r.tournament_id = $1 AND r.status IN ('Confirmed', 'Payment Submitted', 'Pending Payment')
       ORDER BY r.slot_number ASC NULLS LAST, r.created_at ASC`,
      [id]
    );

    res.json({
      tournament,
      matches: matchesRes.rows,
      registered_squads: squadsRes.rows,
    });
  } catch (err: any) {
    console.error('[Get Tournament Details Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve tournament details.' });
  }
});

// POST /api/tournaments (Admin Create)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = tournamentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid tournament data.', details: parse.error.format() });
      return;
    }

    const data = parse.data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertRes = await client.query(
        `INSERT INTO tournaments (
          title, description, game_title, game_mode, map_name, entry_fee, prize_pool,
          max_squads, registration_deadline, match_time, rules, status, publication_status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          data.title,
          data.description || null,
          data.game_title,
          data.game_mode,
          data.map_name,
          data.entry_fee,
          data.prize_pool,
          data.max_squads,
          new Date(data.registration_deadline),
          new Date(data.match_time),
          data.rules || null,
          data.status,
          data.publication_status,
          req.user!.id,
        ]
      );

      const tournament = insertRes.rows[0];

      // Auto-create initial match
      await client.query(
        `INSERT INTO matches (tournament_id, match_number, scheduled_time, status)
         VALUES ($1, 1, $2, 'Scheduled')`,
        [tournament.id, tournament.match_time]
      );

      await recordAuditLog({
        actorId: req.user!.id,
        action: 'CREATE_TOURNAMENT',
        targetEntity: 'tournaments',
        targetId: tournament.id,
        metadata: { title: tournament.title, prize_pool: tournament.prize_pool },
        ipAddress: req.ip,
      });

      await client.query('COMMIT');
      res.status(201).json({ success: true, tournament });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Create Tournament Error]:', err);
    res.status(500).json({ error: 'Failed to create tournament.' });
  }
});

// PUT /api/tournaments/:id (Admin Update)
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parse = tournamentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid tournament data.', details: parse.error.format() });
      return;
    }

    const data = parse.data;

    const updateRes = await pool.query(
      `UPDATE tournaments
       SET title = $1, description = $2, game_title = $3, game_mode = $4, map_name = $5,
           entry_fee = $6, prize_pool = $7, max_squads = $8, registration_deadline = $9,
           match_time = $10, rules = $11, status = $12, publication_status = $13, updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        data.title,
        data.description || null,
        data.game_title,
        data.game_mode,
        data.map_name,
        data.entry_fee,
        data.prize_pool,
        data.max_squads,
        new Date(data.registration_deadline),
        new Date(data.match_time),
        data.rules || null,
        data.status,
        data.publication_status,
        id,
      ]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    // Always keep matches.scheduled_time synchronized with the tournament's match_time
    try {
      await pool.query(
        `UPDATE matches
         SET scheduled_time = $1, updated_at = NOW()
         WHERE tournament_id = $2`,
        [new Date(data.match_time), id]
      );
    } catch {
      await pool.query(
        `UPDATE matches
         SET scheduled_time = $1
         WHERE tournament_id = $2`,
        [new Date(data.match_time), id]
      );
    }

    await recordAuditLog({
      actorId: req.user!.id,
      action: 'UPDATE_TOURNAMENT',
      targetEntity: 'tournaments',
      targetId: id,
      metadata: { title: data.title, status: data.status },
      ipAddress: req.ip,
    });

    res.json({ success: true, tournament: updateRes.rows[0] });
  } catch (err: any) {
    console.error('[Update Tournament Error]:', err);
    res.status(500).json({ error: 'Failed to update tournament.' });
  }
});

// PATCH /api/tournaments/:id/status (Admin Quick Status Change)
router.patch('/:id/status', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, publication_status } = req.body;

    const resUpdate = await pool.query(
      `UPDATE tournaments
       SET status = COALESCE($1, status),
           publication_status = COALESCE($2, publication_status),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, status, publication_status`,
      [status || null, publication_status || null, id]
    );

    if (resUpdate.rows.length === 0) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    await recordAuditLog({
      actorId: req.user!.id,
      action: 'CHANGE_TOURNAMENT_STATUS',
      targetEntity: 'tournaments',
      targetId: id,
      metadata: { newStatus: status, publicationStatus: publication_status },
      ipAddress: req.ip,
    });

    res.json({ success: true, tournament: resUpdate.rows[0] });
  } catch (err: any) {
    console.error('[Change Status Error]:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

export default router;
