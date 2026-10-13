import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';

const router = Router();

// GET /api/notifications (User's Notifications)
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const listRes = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id]
    );

    const unreadCountRes = await pool.query(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [req.user!.id]
    );

    res.json({
      notifications: listRes.rows,
      unread_count: parseInt(unreadCountRes.rows[0].unread_count, 10),
    });
  } catch (err: any) {
    console.error('[Get Notifications Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read (Mark as Read)
router.patch('/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, req.user!.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// PATCH /api/notifications/read-all (Mark all read)
router.patch('/read-all', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user!.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

// POST /api/notifications/admin/broadcast (Admin Broadcast)
router.post('/admin/broadcast', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      title: z.string().min(2).max(200),
      message: z.string().min(5),
      type: z.string().default('Announcement'),
      link: z.string().optional(),
    });

    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Title and message are required.' });
      return;
    }

    const { title, message, type, link } = parse.data;

    // Send to all active users
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       SELECT id, $1, $2, $3, $4 FROM users WHERE is_suspended = FALSE`,
      [title, message, type, link || null]
    );

    await recordAuditLog({
      actorId: req.user!.id,
      action: 'BROADCAST_NOTIFICATION',
      targetEntity: 'notifications',
      metadata: { title },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Broadcast notification dispatched to all users.' });
  } catch (err: any) {
    console.error('[Broadcast Error]:', err);
    res.status(500).json({ error: 'Failed to send broadcast notification.' });
  }
});

export default router;
