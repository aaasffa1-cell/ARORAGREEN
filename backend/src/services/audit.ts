import { pool } from '../db/pool';

export interface AuditLogEntry {
  actorId?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
}

export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Sanitize metadata to never include secrets, tokens, or passwords
    const safeMetadata = { ...(entry.metadata || {}) };
    delete safeMetadata.password;
    delete safeMetadata.room_password;
    delete safeMetadata.roomPassword;
    delete safeMetadata.otp;
    delete safeMetadata.token;
    delete safeMetadata.sessionToken;

    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_entity, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.actorId || null,
        entry.action,
        entry.targetEntity,
        entry.targetId || null,
        JSON.stringify(safeMetadata),
        entry.ipAddress || null,
      ]
    );
  } catch (error: any) {
    console.error('[Audit Log Error]: Failed to write audit log:', error.message);
  }
}
