import crypto from 'crypto';
import { pool } from '../db/pool';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

export function generateCryptoOtp(): string {
  // Generates secure 6-digit number between 100000 and 999999
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string, salt: string): string {
  return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

export async function createOtpChallenge(email: string, ipAddress?: string): Promise<{ otp: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const otp = generateCryptoOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(otp, salt);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Invalidate any existing active challenges for this email
    await client.query(
      `UPDATE otp_challenges 
       SET is_consumed = TRUE 
       WHERE email = $1 AND is_consumed = FALSE`,
      [normalizedEmail]
    );

    // 2. Insert new challenge
    await client.query(
      `INSERT INTO otp_challenges (email, otp_hash, salt, attempts_remaining, expires_at, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [normalizedEmail, otpHash, salt, MAX_ATTEMPTS, expiresAt, ipAddress || null]
    );

    await client.query('COMMIT');
    return { otp };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export interface VerifyOtpResult {
  valid: boolean;
  message?: string;
}

export async function verifyOtpChallenge(email: string, submittedOtp: string): Promise<VerifyOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch active challenge
    const res = await client.query(
      `SELECT id, otp_hash, salt, attempts_remaining, expires_at, is_consumed
       FROM otp_challenges
       WHERE email = $1 AND is_consumed = FALSE
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [normalizedEmail]
    );

    if (res.rows.length === 0) {
      await client.query('COMMIT');
      return { valid: false, message: 'Invalid or expired OTP. Please request a new code.' };
    }

    const challenge = res.rows[0];

    // Check expiry
    if (new Date() > new Date(challenge.expires_at)) {
      await client.query('UPDATE otp_challenges SET is_consumed = TRUE WHERE id = $1', [challenge.id]);
      await client.query('COMMIT');
      return { valid: false, message: 'Code has expired. Please request a new one.' };
    }

    // Check attempts remaining
    if (challenge.attempts_remaining <= 0) {
      await client.query('UPDATE otp_challenges SET is_consumed = TRUE WHERE id = $1', [challenge.id]);
      await client.query('COMMIT');
      return { valid: false, message: 'Too many incorrect attempts. Please request a new code.' };
    }

    // Verify hash
    const computedHash = hashOtp(submittedOtp.trim(), challenge.salt);
    if (computedHash !== challenge.otp_hash) {
      // Decrement attempts
      const updatedAttempts = challenge.attempts_remaining - 1;
      await client.query(
        `UPDATE otp_challenges 
         SET attempts_remaining = $1, is_consumed = ($1 <= 0)
         WHERE id = $2`,
        [updatedAttempts, challenge.id]
      );
      await client.query('COMMIT');
      return {
        valid: false,
        message: updatedAttempts > 0 
          ? `Incorrect code. ${updatedAttempts} attempts remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      };
    }

    // Single-use: Mark consumed immediately
    await client.query(
      `UPDATE otp_challenges SET is_consumed = TRUE WHERE id = $1`,
      [challenge.id]
    );

    await client.query('COMMIT');
    return { valid: true };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
