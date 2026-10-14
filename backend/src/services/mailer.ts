import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure = process.env.SMTP_SECURE === 'true';
const emailFrom = process.env.EMAIL_FROM || 'ARORA ESPORTS <noreply@aroraesports.com>';

const isConfigured = Boolean(smtpUser && smtpPass && smtpUser !== 'your_gmail_address@gmail.com');

const transporter = isConfigured
  ? nodemailer.createTransport({
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  const startedAt = Date.now();
  try {
    if (transporter) {
      await transporter.sendMail({
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`[SMTP Mailer] Email sent to ${options.to} in ${Date.now() - startedAt}ms.`);
      return { success: true };
    } else {
      // Local development fallback: Log formatted email
      console.log('\n=================== [ARORA ESPORTS EMAIL NOTICE] ===================');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`(Configure SMTP_USER & SMTP_PASS in backend/.env for live Gmail delivery)`);
      if (options.text) {
        console.log(`Text Body:\n${options.text}`);
      }
      console.log('====================================================================\n');
      return { success: true };
    }
  } catch (error: any) {
    console.error(`[SMTP Mailer Error] Failed sending to ${options.to} after ${Date.now() - startedAt}ms:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const subject = 'Your ARORA ESPORTS Login Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #050B10; color: #EAF4F4; padding: 30px; border-radius: 8px; max-width: 500px; margin: auto; border: 1px solid #18333A;">
      <h2 style="color: #00F5A0; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">ARORA ESPORTS</h2>
      <p style="color: #9CA3AF;">Use the one-time code below to authenticate your session. This code is valid for <strong>5 minutes</strong> only and cannot be reused.</p>
      <div style="background: #071A20; border: 1px solid #00F5A0; border-radius: 6px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00F5A0;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #6B7280;">If you did not request this verification code, please ignore this email or contact support immediately.</p>
      <p style="font-size: 11px; color: #4B5563; margin-top: 20px; border-top: 1px solid #18333A; padding-top: 10px;">&copy; ${new Date().getFullYear()} ARORA ESPORTS. All rights reserved.</p>
    </div>
  `;
  const text = `ARORA ESPORTS Verification Code: ${otp}\nValid for 5 minutes. Do not share this code.`;
  return sendEmail({ to: toEmail, subject, html, text });
}

export async function sendRoomCredentialsEmail(
  toEmail: string,
  tournamentTitle: string,
  roomId: string,
  roomPassword: string,
  matchTimeStr: string,
  slotNumber?: number | string
): Promise<{ success: boolean; error?: string }> {
  const subject = `[OFFICIAL] Custom Room Credentials: ${tournamentTitle}`;
  const slotBadge = slotNumber ? `<p style="margin: 6px 0; font-size: 18px; color: #F59E0B;"><strong>Assigned Slot:</strong> Slot #${slotNumber}</p>` : '';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #050B10; color: #EAF4F4; padding: 30px; border-radius: 8px; max-width: 550px; margin: auto; border: 1px solid #00D9FF;">
      <h2 style="color: #00D9FF; margin-top: 0; text-transform: uppercase;">ARORA ESPORTS MATCH ROOM</h2>
      <p style="color: #9CA3AF;">Official match credentials have been released for tournament: <strong>${tournamentTitle}</strong>.</p>
      <div style="background: #071A20; border-left: 4px solid #00D9FF; border-radius: 4px; padding: 18px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 16px;"><strong>Match Time:</strong> ${matchTimeStr}</p>
        ${slotBadge}
        <p style="margin: 6px 0; font-size: 20px; color: #00F5A0;"><strong>Room ID:</strong> <span style="font-family: monospace;">${roomId}</span></p>
        <p style="margin: 6px 0; font-size: 20px; color: #00D9FF;"><strong>Password:</strong> <span style="font-family: monospace;">${roomPassword}</span></p>
      </div>
      <p style="color: #EAF4F4; font-size: 14px;"><strong>Important Instructions:</strong></p>
      <ul style="color: #9CA3AF; font-size: 13px; line-height: 1.6;">
        <li style="color: #F59E0B; font-weight: bold;">You MUST enter exclusively in your assigned Squad Slot ${slotNumber ? `(#${slotNumber})` : ''} in the Free Fire custom room. Sitting in another squad's slot will result in immediate kick/disqualification.</li>
        <li>Ensure all 4 registered squad members are present in the room at least 5 minutes prior to start time. Late entrants will be replaced.</li>
        <li>Do NOT share these credentials with non-registered players. Room password leak results in permanent team ban.</li>
      </ul>
      <p style="font-size: 11px; color: #4B5563; margin-top: 20px; border-top: 1px solid #18333A; padding-top: 10px;">&copy; ${new Date().getFullYear()} ARORA ESPORTS Tournament Ops.</p>
    </div>
  `;
  const text = `ARORA ESPORTS Match Room Credentials for ${tournamentTitle}:\n${slotNumber ? `Assigned Slot: #${slotNumber}\n` : ''}Room ID: ${roomId}\nPassword: ${roomPassword}\nMatch Time: ${matchTimeStr}\nReminder: Enter only in your assigned slot in-game.`;
  return sendEmail({ to: toEmail, subject, html, text });
}

export async function sendPaymentDecisionEmail(
  toEmail: string,
  tournamentTitle: string,
  decision: 'Verified' | 'Rejected',
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const isApproved = decision === 'Verified';
  const subject = `Payment Update: ${tournamentTitle} - ${decision}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #050B10; color: #EAF4F4; padding: 30px; border-radius: 8px; max-width: 500px; margin: auto; border: 1px solid ${isApproved ? '#00F5A0' : '#EF4444'};">
      <h2 style="color: ${isApproved ? '#00F5A0' : '#EF4444'}; margin-top: 0;">Payment ${decision}</h2>
      <p style="color: #9CA3AF;">Your manual UPI payment submission for <strong>${tournamentTitle}</strong> has been reviewed by the tournament administrator.</p>
      <div style="background: #071A20; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; color: #EAF4F4;">Status: <strong>${decision}</strong></p>
        ${reason ? `<p style="margin: 8px 0 0 0; color: #EF4444; font-size: 13px;">Reason: ${reason}</p>` : ''}
      </div>
      <p style="font-size: 12px; color: #9CA3AF;">${isApproved ? 'Your squad registration is now officially CONFIRMED. Check your player dashboard for upcoming match schedules.' : 'Please log in to your dashboard to re-verify your transaction reference or contact support.'}</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}
