import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';

const router = Router();

const memberSchema = z.object({
  ign: z.string().min(2, 'IGN must be at least 2 characters').max(50),
  uid: z.string().min(6, 'Free Fire UID must be at least 6 digits').max(30),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
});

const squadSchema = z.object({
  name: z.string().min(3, 'Squad name must be at least 3 characters').max(100),
  captain_ign: z.string().min(2, 'Captain IGN is required').max(50),
  captain_uid: z.string().min(6, 'Captain UID is required').max(30),
  captain_phone: z.string().max(20).optional(),
  teammates: z.array(memberSchema).length(3, 'A complete squad must have exactly 3 teammates (4 players total with Captain)'),
});

// GET /api/squads/my-squad (Get current player's squad)
router.get('/my-squad', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const squadRes = await pool.query(
      `SELECT s.*, u.email as captain_email, u.display_name as captain_display_name
       FROM squads s
       JOIN users u ON s.captain_id = u.id
       WHERE s.captain_id = $1`,
      [req.user!.id]
    );

    if (squadRes.rows.length === 0) {
      res.json({ squad: null, members: [] });
      return;
    }

    const squad = squadRes.rows[0];

    const membersRes = await pool.query(
      `SELECT id, ign, uid, phone, email, is_captain
       FROM squad_members
       WHERE squad_id = $1
       ORDER BY is_captain DESC, created_at ASC`,
      [squad.id]
    );

    res.json({
      squad,
      members: membersRes.rows,
    });
  } catch (err: any) {
    console.error('[Get My Squad Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve squad details.' });
  }
});

// POST /api/squads (Create or Update Captain's 4-Player Squad)
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = squadSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid squad data.', details: parse.error.format() });
      return;
    }

    const { name, captain_ign, captain_uid, captain_phone, teammates } = parse.data;

    // Check for duplicate UIDs within the squad
    const allUids = [captain_uid, ...teammates.map((t) => t.uid)];
    const uniqueUids = new Set(allUids);
    if (uniqueUids.size !== allUids.length) {
      res.status(400).json({ error: 'Duplicate Free Fire UID found. Every squad member must have a distinct UID.' });
      return;
    }

    const result = await withTransaction(async (client) => {
      // 1. Check if user already has a squad
      let squadRes = await client.query(
        'SELECT id FROM squads WHERE captain_id = $1 FOR UPDATE',
        [req.user!.id]
      );

      let squadId: string;
      if (squadRes.rows.length === 0) {
        const insertSquad = await client.query(
          `INSERT INTO squads (name, captain_id) VALUES ($1, $2) RETURNING id`,
          [name, req.user!.id]
        );
        squadId = insertSquad.rows[0].id;
      } else {
        squadId = squadRes.rows[0].id;
        await client.query(
          `UPDATE squads SET name = $1, updated_at = NOW() WHERE id = $2`,
          [name, squadId]
        );
        // Remove existing members to overwrite cleanly
        await client.query('DELETE FROM squad_members WHERE squad_id = $1', [squadId]);
      }

      // 2. Insert Captain as member
      await client.query(
        `INSERT INTO squad_members (squad_id, user_id, ign, uid, phone, email, is_captain)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [squadId, req.user!.id, captain_ign, captain_uid, captain_phone || null, req.user!.email]
      );

      // Also update user's own profile IGN and UID for convenience
      await client.query(
        `UPDATE users SET free_fire_ign = $1, free_fire_uid = $2 WHERE id = $3`,
        [captain_ign, captain_uid, req.user!.id]
      );

      // 3. Insert 3 Teammates
      for (const t of teammates) {
        await client.query(
          `INSERT INTO squad_members (squad_id, ign, uid, phone, email, is_captain)
           VALUES ($1, $2, $3, $4, $5, FALSE)`,
          [squadId, t.ign, t.uid, t.phone || null, t.email || null]
        );
      }

      return squadId;
    });

    res.json({ success: true, message: 'Squad successfully saved.', squad_id: result });
  } catch (err: any) {
    console.error('[Create Squad Error]:', err);
    res.status(500).json({ error: 'Failed to create squad.' });
  }
});

// GET /api/squads/admin/all (Admin View Squads)
router.get('/admin/all', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const squadsRes = await pool.query(
      `SELECT s.id, s.name, s.created_at,
              u.display_name as captain_name, u.email as captain_email, u.phone as captain_phone,
              COUNT(DISTINCT sm.id) as member_count,
              COUNT(DISTINCT r.id) as registrations_count,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', sm.id,
                    'ign', sm.ign,
                    'uid', sm.uid,
                    'phone', sm.phone,
                    'email', sm.email,
                    'is_captain', sm.is_captain
                  ) ORDER BY sm.is_captain DESC, sm.created_at ASC
                ) FILTER (WHERE sm.id IS NOT NULL),
                '[]'::json
              ) as members
       FROM squads s
       JOIN users u ON s.captain_id = u.id
       LEFT JOIN squad_members sm ON s.id = sm.squad_id
       LEFT JOIN registrations r ON s.id = r.squad_id
       GROUP BY s.id, u.id
       ORDER BY s.created_at DESC`
    );

    res.json({ squads: squadsRes.rows });
  } catch (err: any) {
    console.error('[Admin Squads Error]:', err);
    res.status(500).json({ error: 'Failed to fetch squads.' });
  }
});

export default router;
