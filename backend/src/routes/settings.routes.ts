import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAdmin } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';

const router = Router();

const settingsSchema = z.object({
  upi_id: z.string().min(3).max(100),
  upi_payee_name: z.string().min(2).max(100),
  upi_qr_image_url: z.string().optional(),
  support_email: z.string().email(),
  support_phone: z.string().max(50).optional(),
  support_telegram: z.string().max(200).optional(),
  rules_text: z.string().optional(),
  announcements: z.string().optional(),
});

// GET /api/settings (Public Website Settings)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const sRes = await pool.query('SELECT * FROM website_settings WHERE id = $1', ['primary']);
    if (sRes.rows.length === 0) {
      // Return safe defaults
      res.json({
        settings: {
          upi_id: '9010418179-2.wallet@phonepe',
          upi_payee_name: 'ARORA ESPORTS (PhonePe)',
          upi_qr_image_url: '/assets/phonepe_upi_qr.jpg',
          support_email: 'aaasffa1@gmail.com',
          support_phone: '9010418179',
          support_telegram: 'https://t.me/gaiusmorgan901',
          rules_text: 'Standard Free Fire competitive tournament rules apply.',
          announcements: 'Welcome to ARORA ESPORTS official tournament platform.',
        },
      });
      return;
    }
    res.json({ settings: sRes.rows[0] });
  } catch (err: any) {
    console.error('[Get Settings Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve website settings.' });
  }
});

// PUT /api/settings (Admin Update Settings)
router.put('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = settingsSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid settings configuration.', details: parse.error.format() });
      return;
    }

    const {
      upi_id,
      upi_payee_name,
      upi_qr_image_url,
      support_email,
      support_phone,
      support_telegram,
      rules_text,
      announcements,
    } = parse.data;

    const upsertRes = await pool.query(
      `INSERT INTO website_settings (
        id, upi_id, upi_payee_name, upi_qr_image_url, support_email, support_phone, support_telegram, rules_text, announcements, updated_by, updated_at
      ) VALUES (
        'primary', $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET upi_id = EXCLUDED.upi_id,
          upi_payee_name = EXCLUDED.upi_payee_name,
          upi_qr_image_url = EXCLUDED.upi_qr_image_url,
          support_email = EXCLUDED.support_email,
          support_phone = EXCLUDED.support_phone,
          support_telegram = EXCLUDED.support_telegram,
          rules_text = EXCLUDED.rules_text,
          announcements = EXCLUDED.announcements,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      RETURNING *`,
      [
        upi_id,
        upi_payee_name,
        upi_qr_image_url || '/assets/phonepe_upi_qr.jpg',
        support_email,
        support_phone || null,
        support_telegram || null,
        rules_text || null,
        announcements || null,
        req.user!.id,
      ]
    );

    await recordAuditLog({
      actorId: req.user!.id,
      action: 'UPDATE_WEBSITE_SETTINGS',
      targetEntity: 'website_settings',
      targetId: 'primary',
      metadata: { upi_id, upi_payee_name },
      ipAddress: req.ip,
    });

    res.json({ success: true, settings: upsertRes.rows[0] });
  } catch (err: any) {
    console.error('[Update Settings Error]:', err);
    res.status(500).json({ error: 'Failed to update website settings.' });
  }
});

export default router;
