import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';
import { sendPaymentDecisionEmail } from '../services/mailer';

const router = Router();

const submitPaymentSchema = z.object({
  registration_id: z.string().uuid(),
  utr: z.string().min(8, 'UTR / Reference Number must be at least 8 characters').max(64),
  notes: z.string().max(300).optional(),
});

const paymentDecisionSchema = z.object({
  decision: z.enum(['Verified', 'Rejected']),
  note: z.string().optional(),
  rejection_reason: z.string().optional(),
});

// POST /api/payments/submit (Player submits manual UPI payment with UTR)
router.post('/submit', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = submitPaymentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Please provide a valid registration ID and UTR reference number.' });
      return;
    }

    const { registration_id, utr, notes } = parse.data;
    const cleanUtr = utr.trim().toUpperCase();

    const result = await withTransaction(async (client) => {
      // 1. Verify Registration & ownership
      const regRes = await client.query(
        `SELECT r.id, r.tournament_id, r.squad_id, r.captain_id, r.status,
                t.title as tournament_title, t.entry_fee
         FROM registrations r
         JOIN tournaments t ON r.tournament_id = t.id
         WHERE r.id = $1
         FOR UPDATE`,
        [registration_id]
      );

      if (regRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Registration not found.' };
      }

      const reg = regRes.rows[0];

      if (reg.captain_id !== req.user!.id) {
        throw { statusCode: 403, message: 'Only the Squad Captain can submit payment for this registration.' };
      }

      if (reg.status === 'Confirmed') {
        throw { statusCode: 400, message: 'Registration is already verified and confirmed.' };
      }

      // 2. Prevent duplicate UTR
      const utrCheck = await client.query('SELECT id, registration_id FROM payments WHERE utr = $1', [cleanUtr]);
      if (utrCheck.rows.length > 0) {
        throw {
          statusCode: 400,
          message: 'This UTR / Transaction Reference Number has already been submitted on the platform.',
        };
      }

      // 3. Upsert Payment Record (Pending Verification)
      const paymentRes = await client.query(
        `INSERT INTO payments (
          registration_id, tournament_id, squad_id, captain_id, amount, utr, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Pending Verification', $7)
        ON CONFLICT (utr) DO NOTHING
        RETURNING *`,
        [
          reg.id,
          reg.tournament_id,
          reg.squad_id,
          reg.captain_id,
          parseFloat(reg.entry_fee),
          cleanUtr,
          notes || null,
        ]
      );

      // 4. Update Registration Status
      await client.query(
        `UPDATE registrations SET status = 'Payment Submitted', updated_at = NOW() WHERE id = $1`,
        [reg.id]
      );

      // 5. In-app notification
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, 'Payment Awaiting Review', $2, 'Payment', '/player/my-payments')`,
        [
          req.user!.id,
          `UTR ${cleanUtr} submitted for "${reg.tournament_title}". Tournament organizers will manually verify the payment.`,
        ]
      );

      return paymentRes.rows[0];
    });

    res.status(201).json({
      success: true,
      message: 'Payment reference submitted. Status is now Pending Verification.',
      payment: result,
    });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[Submit Payment Error]:', err);
    res.status(500).json({ error: 'Failed to submit payment details.' });
  }
});

// GET /api/payments/my (Player's payment submissions)
router.get('/my', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const pRes = await pool.query(
      `SELECT p.*,
              t.title as tournament_title,
              s.name as squad_name
       FROM payments p
       JOIN tournaments t ON p.tournament_id = t.id
       JOIN squads s ON p.squad_id = s.id
       WHERE p.captain_id = $1
       ORDER BY p.submitted_at DESC`,
      [req.user!.id]
    );

    res.json({ payments: pRes.rows });
  } catch (err: any) {
    console.error('[Get My Payments Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve payments.' });
  }
});

// GET /api/payments/admin/all (Admin review payments)
router.get('/admin/all', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    let queryText = `
      SELECT p.*,
             t.title as tournament_title,
             s.name as squad_name,
             u.display_name as captain_name, u.email as captain_email, u.phone as captain_phone,
             rev.display_name as reviewer_name
      FROM payments p
      JOIN tournaments t ON p.tournament_id = t.id
      JOIN squads s ON p.squad_id = s.id
      JOIN users u ON p.captain_id = u.id
      LEFT JOIN users rev ON p.reviewer_id = rev.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && typeof status === 'string' && status !== 'all') {
      params.push(status);
      queryText += ` AND p.status = $${params.length}`;
    }

    queryText += ` ORDER BY p.submitted_at DESC`;

    const result = await pool.query(queryText, params);
    res.json({ payments: result.rows });
  } catch (err: any) {
    console.error('[Admin Payments Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve payments for review.' });
  }
});

// POST /api/payments/admin/:id/decision (Admin Approve or Reject Payment)
router.post('/admin/:id/decision', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parse = paymentDecisionSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid decision payload. Must specify Verified or Rejected.' });
      return;
    }

    const { decision, note, rejection_reason } = parse.data;

    const result = await withTransaction(async (client) => {
      // 1. Fetch payment with lock
      const payRes = await client.query(
        `SELECT p.*, t.title as tournament_title, u.email as captain_email, u.id as captain_user_id
         FROM payments p
         JOIN tournaments t ON p.tournament_id = t.id
         JOIN users u ON p.captain_id = u.id
         WHERE p.id = $1
         FOR UPDATE`,
        [id]
      );

      if (payRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Payment record not found.' };
      }

      const payment = payRes.rows[0];
      const previousStatus = payment.status;

      // 2. Update payment status
      await client.query(
        `UPDATE payments
         SET status = $1, reviewer_id = $2, rejection_reason = $3, reviewed_at = NOW()
         WHERE id = $4`,
        [decision, req.user!.id, decision === 'Rejected' ? (rejection_reason || 'UTR could not be matched') : null, id]
      );

      // 3. Update registration status accordingly
      const newRegStatus = decision === 'Verified' ? 'Confirmed' : 'Rejected';
      await client.query(
        `UPDATE registrations SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newRegStatus, payment.registration_id]
      );

      // 4. Record in Payment Verification History (Audit log for payments)
      await client.query(
        `INSERT INTO payment_verification_history (payment_id, previous_status, new_status, reviewer_id, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, previousStatus, decision, req.user!.id, note || rejection_reason || null]
      );

      // 5. In-app notification for Captain
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'Payment', '/player/my-tournaments')`,
        [
          payment.captain_user_id,
          `Payment ${decision}: ${payment.tournament_title}`,
          decision === 'Verified'
            ? `Your payment has been manually verified by Admin. Squad slot is officially CONFIRMED!`
            : `Payment verification was rejected. Reason: ${rejection_reason || 'Reference mismatch'}. Please check details.`,
        ]
      );

      // 6. Audit Log
      await recordAuditLog({
        actorId: req.user!.id,
        action: `PAYMENT_${decision.toUpperCase()}`,
        targetEntity: 'payments',
        targetId: id,
        metadata: {
          utr: payment.utr,
          amount: payment.amount,
          decision,
          rejection_reason: rejection_reason || null,
        },
        ipAddress: req.ip,
      });

      return {
        captainEmail: payment.captain_email,
        tournamentTitle: payment.tournament_title,
      };
    });

    // Send email notification outside transaction
    await sendPaymentDecisionEmail(
      result.captainEmail,
      result.tournamentTitle,
      decision,
      rejection_reason
    );

    res.json({
      success: true,
      message: `Payment has been marked as ${decision}.`,
    });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[Payment Decision Error]:', err);
    res.status(500).json({ error: 'Failed to record payment decision.' });
  }
});

export default router;
