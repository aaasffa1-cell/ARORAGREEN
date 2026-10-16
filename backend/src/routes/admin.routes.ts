import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';

const router = Router();

// Apply requireAdmin to all admin overview endpoints
router.use(requireAdmin);

// GET /api/admin/overview (KPIs from actual DB queries)
router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalTournamentsRes,
      totalRegistrationsRes,
      totalSquadsRes,
      openRegistrationsRes,
      confirmedSquadsRes,
      pendingPaymentsRes,
      verifiedPaymentsRes,
      rejectedPaymentsRes,
      totalRevenueRes,
      upcomingMatchesRes,
      recentActivityRes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM tournaments'),
      pool.query('SELECT COUNT(*) as count FROM registrations'),
      pool.query('SELECT COUNT(*) as count FROM squads'),
      pool.query("SELECT COUNT(*) as count FROM tournaments WHERE status = 'Registration Open'"),
      pool.query("SELECT COUNT(*) as count FROM registrations WHERE status = 'Confirmed'"),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status = 'Pending Verification'"),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status = 'Verified'"),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status = 'Rejected'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Verified'"),
      pool.query("SELECT COUNT(*) as count FROM matches WHERE scheduled_time > NOW() AND status = 'Scheduled'"),
      pool.query(`
        SELECT al.*, u.email as actor_email, u.display_name as actor_name
        FROM audit_logs al
        LEFT JOIN users u ON al.actor_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      metrics: {
        total_tournaments: parseInt(totalTournamentsRes.rows[0].count, 10),
        total_registrations: parseInt(totalRegistrationsRes.rows[0].count, 10),
        total_squads: parseInt(totalSquadsRes.rows[0].count, 10),
        open_registrations: parseInt(openRegistrationsRes.rows[0].count, 10),
        confirmed_squads: parseInt(confirmedSquadsRes.rows[0].count, 10),
        pending_payments: parseInt(pendingPaymentsRes.rows[0].count, 10),
        verified_payments: parseInt(verifiedPaymentsRes.rows[0].count, 10),
        rejected_payments: parseInt(rejectedPaymentsRes.rows[0].count, 10),
        total_revenue: parseFloat(totalRevenueRes.rows[0].total),
        upcoming_matches: parseInt(upcomingMatchesRes.rows[0].count, 10),
      },
      recent_activity: recentActivityRes.rows,
    });
  } catch (err: any) {
    console.error('[Admin Overview Error]:', err);
    res.status(500).json({ error: 'Failed to calculate admin metrics.' });
  }
});

// GET /api/admin/users (User Management List)
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    let queryText = `
      SELECT u.id, u.email, u.display_name, u.phone, u.free_fire_ign, u.free_fire_uid,
             u.is_suspended, u.created_at,
             ARRAY_AGG(DISTINCT ur.role) as roles,
             COUNT(DISTINCT r.id) as registrations_count,
             COUNT(DISTINCT s.id) as squads_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN registrations r ON u.id = r.captain_id
      LEFT JOIN squads s ON u.id = s.captain_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string') {
      params.push(`%${search}%`);
      queryText += ` AND (u.email ILIKE $${params.length} OR u.display_name ILIKE $${params.length} OR u.free_fire_ign ILIKE $${params.length})`;
    }

    queryText += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const usersRes = await pool.query(queryText, params);
    res.json({ users: usersRes.rows });
  } catch (err: any) {
    console.error('[Admin Users Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve user accounts.' });
  }
});

// PATCH /api/admin/users/:id/suspend (Suspend/Reactivate Account)
router.patch('/users/:id/suspend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_suspended } = req.body;

    if (id === req.user!.id) {
      res.status(400).json({ error: 'You cannot suspend your own administrative account.' });
      return;
    }

    await pool.query('UPDATE users SET is_suspended = $1, updated_at = NOW() WHERE id = $2', [
      Boolean(is_suspended),
      id,
    ]);

    // Invalidate sessions if suspended
    if (is_suspended) {
      await pool.query('UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1', [id]);
    }

    await recordAuditLog({
      actorId: req.user!.id,
      action: is_suspended ? 'SUSPEND_USER' : 'REACTIVATE_USER',
      targetEntity: 'users',
      targetId: id,
      metadata: { is_suspended },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `User account has been ${is_suspended ? 'suspended' : 'reactivated'}.` });
  } catch (err: any) {
    console.error('[Suspend User Error]:', err);
    res.status(500).json({ error: 'Failed to modify account suspension state.' });
  }
});

// DELETE /api/admin/users/:id (Admin Delete User Account from Neon DB)
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      res.status(400).json({ error: 'You cannot delete your own administrative account.' });
      return;
    }

    const userRes = await pool.query('SELECT id, email, display_name FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found in database.' });
      return;
    }
    const targetUser = userRes.rows[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Identify all squads where this user is Captain
      const squadsRes = await client.query('SELECT id FROM squads WHERE captain_id = $1', [id]);
      const squadIds = squadsRes.rows.map((r: { id: string }) => r.id);

      if (squadIds.length > 0) {
        // Delete payment verification history for payments made by these squads
        await client.query(
          `DELETE FROM payment_verification_history
           WHERE payment_id IN (SELECT id FROM payments WHERE squad_id = ANY($1) OR captain_id = $2)`,
          [squadIds, id]
        );

        // Delete payments
        await client.query('DELETE FROM payments WHERE squad_id = ANY($1) OR captain_id = $2', [squadIds, id]);

        // Delete tournament results
        await client.query('DELETE FROM tournament_results WHERE squad_id = ANY($1)', [squadIds]);

        // Delete registrations
        await client.query('DELETE FROM registrations WHERE squad_id = ANY($1) OR captain_id = $2', [squadIds, id]);

        // Delete squad members of captained squads
        await client.query('DELETE FROM squad_members WHERE squad_id = ANY($1)', [squadIds]);

        // Delete captained squads
        await client.query('DELETE FROM squads WHERE captain_id = $1', [id]);
      } else {
        // Clear any payments or registrations referencing this user directly
        await client.query(
          `DELETE FROM payment_verification_history
           WHERE payment_id IN (SELECT id FROM payments WHERE captain_id = $1)`,
          [id]
        );
        await client.query('DELETE FROM payments WHERE captain_id = $1', [id]);
        await client.query('DELETE FROM registrations WHERE captain_id = $1', [id]);
      }

      // 2. Remove user link from any teammate squad_members records
      await client.query('DELETE FROM squad_members WHERE user_id = $1', [id]);

      // 3. Reassign reviewer references in audit tables to current acting admin
      await client.query('UPDATE payments SET reviewer_id = NULL WHERE reviewer_id = $1', [id]);
      await client.query(
        'UPDATE payment_verification_history SET reviewer_id = $2 WHERE reviewer_id = $1',
        [id, req.user!.id]
      );

      // 4. Nullify non-critical audit/logging links
      await client.query('UPDATE protected_room_credentials SET release_initiated_by = NULL WHERE release_initiated_by = $1', [id]);
      await client.query('UPDATE tournament_results SET published_by = NULL WHERE published_by = $1', [id]);
      await client.query('UPDATE tournaments SET created_by = NULL WHERE created_by = $1', [id]);
      await client.query('UPDATE email_delivery_logs SET recipient_id = NULL WHERE recipient_id = $1', [id]);
      await client.query('UPDATE audit_logs SET actor_id = NULL WHERE actor_id = $1', [id]);
      await client.query('UPDATE website_settings SET updated_by = NULL WHERE updated_by = $1', [id]);

      // 5. Delete sessions, notifications, and user roles
      await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

      // 6. Delete OTP challenges
      await client.query('DELETE FROM otp_challenges WHERE email = $1', [targetUser.email]);

      // 7. Finally delete the user row from Neon DB
      await client.query('DELETE FROM users WHERE id = $1', [id]);

      await recordAuditLog({
        actorId: req.user!.id,
        action: 'DELETE_USER',
        targetEntity: 'users',
        targetId: id,
        metadata: { email: targetUser.email, display_name: targetUser.display_name },
        ipAddress: req.ip,
      });

      await client.query('COMMIT');
      res.json({ success: true, message: `User "${targetUser.email}" permanently deleted from database.` });
    } catch (txErr) {
      await client.query('ROLLBACK').catch(() => {});
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Delete User Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to delete user.' });
  }
});

// GET /api/admin/audit-logs (View Audit Trail)
router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const logsRes = await pool.query(
      `SELECT al.*, u.email as actor_email, u.display_name as actor_name
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 100`
    );

    res.json({ audit_logs: logsRes.rows });
  } catch (err: any) {
    console.error('[Get Audit Logs Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
});

// GET /api/admin/delivery-logs (Email Dispatch History)
router.get('/delivery-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const logsRes = await pool.query(
      `SELECT edl.*,
              t.title as tournament_title,
              m.scheduled_time as match_scheduled_time
       FROM email_delivery_logs edl
       LEFT JOIN tournaments t ON edl.tournament_id = t.id
       LEFT JOIN matches m ON edl.match_id = m.id
       ORDER BY edl.created_at DESC
       LIMIT 100`
    );

    res.json({ delivery_logs: logsRes.rows });
  } catch (err: any) {
    console.error('[Get Delivery Logs Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve delivery logs.' });
  }
});

export default router;
