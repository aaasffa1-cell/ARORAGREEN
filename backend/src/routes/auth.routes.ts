import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { pool } from '../db/pool';
import { createOtpChallenge, verifyOtpChallenge } from '../services/otp';
import { sendOtpEmail } from '../services/mailer';
import { recordAuditLog } from '../services/audit';
import { requireAuth } from '../middleware/auth';

const router = Router();

const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per window
  message: { error: 'Too many OTP requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sendOtpSchema = z.object({
  email: z.string().email().max(255),
});

const verifyOtpSchema = z.object({
  email: z.string().email().max(255),
  otp: z.string().length(6),
});

const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  free_fire_ign: z.string().min(2).max(50).optional(),
  free_fire_uid: z.string().min(6).max(30).optional(),
});

// POST /api/auth/send-otp
router.post('/send-otp', sendOtpLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = sendOtpSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const email = parse.data.email.trim().toLowerCase();
    const ip = req.ip || req.socket.remoteAddress;

    const { otp } = await createOtpChallenge(email, ip);

    // Send via Nodemailer (Gmail SMTP or dev fallback)
    await sendOtpEmail(email, otp);

    // Generic safe response to prevent email enumeration
    res.json({
      success: true,
      message: 'If the email is valid, a 6-digit verification code has been dispatched.',
    });
  } catch (err: any) {
    console.error('[Send OTP Error]:', err);
    res.status(500).json({ 
      error: 'Failed to process verification code request. Please try again.',
      details: err.message || String(err)
    });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = verifyOtpSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Please provide email and 6-digit verification code.' });
      return;
    }

    const { email, otp } = parse.data;
    const normalizedEmail = email.trim().toLowerCase();

    const verification = await verifyOtpChallenge(normalizedEmail, otp);
    if (!verification.valid) {
      res.status(400).json({ error: verification.message || 'Invalid verification code.' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get or create user
      let userRes = await client.query(
        'SELECT id, email, display_name, phone, free_fire_ign, free_fire_uid, is_suspended FROM users WHERE email = $1',
        [normalizedEmail]
      );

      let user: any;
      if (userRes.rows.length === 0) {
        const defaultName = normalizedEmail.split('@')[0];
        const newUserRes = await client.query(
          `INSERT INTO users (email, display_name) 
           VALUES ($1, $2) 
           RETURNING id, email, display_name, phone, free_fire_ign, free_fire_uid, is_suspended`,
          [normalizedEmail, defaultName]
        );
        user = newUserRes.rows[0];

        // Assign default Player role
        await client.query(
          `INSERT INTO user_roles (user_id, role) VALUES ($1, 'Player') ON CONFLICT DO NOTHING`,
          [user.id]
        );
      } else {
        user = userRes.rows[0];
      }

      if (user.is_suspended) {
        await client.query('COMMIT');
        res.status(403).json({ error: 'This account has been suspended. Please contact tournament administration.' });
        return;
      }

      // Fetch user roles
      const rolesRes = await client.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
      const roles = rolesRes.rows.map((r: { role: string }) => r.role);

      // 2. Generate secure session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await client.query(
        `INSERT INTO sessions (user_id, session_token, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, sessionToken, req.ip || null, req.headers['user-agent'] || null, expiresAt]
      );

      await client.query('COMMIT');

      // Set HTTP-only secure cookie (using sameSite: 'none' in production for cross-site Render <-> Vercel requests)
      const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.RENDER;
      res.cookie('arora_session', sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        success: true,
        session_token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          phone: user.phone,
          free_fire_ign: user.free_fire_ign,
          free_fire_uid: user.free_fire_uid,
          roles: roles.length > 0 ? roles : ['Player'],
        },
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Verify OTP Error]:', err);
    res.status(500).json({ error: 'Failed to verify code. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ authenticated: false, user: null });
    return;
  }

  res.json({
    authenticated: true,
    user: req.user,
  });
});

// POST /api/auth/update-profile
router.post('/update-profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid profile details.', details: parse.error.format() });
      return;
    }

    const { display_name, phone, free_fire_ign, free_fire_uid } = parse.data;

    await pool.query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           phone = COALESCE($2, phone),
           free_fire_ign = COALESCE($3, free_fire_ign),
           free_fire_uid = COALESCE($4, free_fire_uid),
           updated_at = NOW()
       WHERE id = $5`,
      [display_name || null, phone || null, free_fire_ign || null, free_fire_uid || null, req.user!.id]
    );

    const updated = await pool.query(
      'SELECT id, email, display_name, phone, free_fire_ign, free_fire_uid FROM users WHERE id = $1',
      [req.user!.id]
    );

    res.json({
      success: true,
      user: {
        ...updated.rows[0],
        roles: req.user!.roles,
      },
    });
  } catch (err: any) {
    console.error('[Update Profile Error]:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.arora_session || req.sessionToken;
    if (token) {
      await pool.query('UPDATE sessions SET is_revoked = TRUE WHERE session_token = $1', [token]);
    }

    res.clearCookie('arora_session', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err: any) {
    res.clearCookie('arora_session', { path: '/' });
    res.json({ success: true, message: 'Logged out.' });
  }
});

export default router;
