import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';

export interface AuthenticatedUser {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  free_fire_ign: string | null;
  free_fire_uid: string | null;
  roles: string[];
  is_suspended: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
    }
  }
}

export async function authenticateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.arora_session || 
                  (req.headers.authorization?.startsWith('Bearer ') 
                    ? req.headers.authorization.substring(7) 
                    : null);

    if (!token) {
      return next();
    }

    const sessionRes = await pool.query(
      `SELECT s.id as session_id, s.session_token, s.expires_at, s.is_revoked,
              u.id as user_id, u.email, u.display_name, u.phone, u.free_fire_ign, u.free_fire_uid, u.is_suspended
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.is_revoked = FALSE AND s.expires_at > NOW()`,
      [token]
    );

    if (sessionRes.rows.length === 0) {
      return next();
    }

    const row = sessionRes.rows[0];

    if (row.is_suspended) {
      return next();
    }

    // Fetch user roles
    const rolesRes = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [row.user_id]
    );
    const roles = rolesRes.rows.map((r: { role: string }) => r.role);

    req.user = {
      id: row.user_id,
      email: row.email,
      display_name: row.display_name,
      phone: row.phone,
      free_fire_ign: row.free_fire_ign,
      free_fire_uid: row.free_fire_uid,
      roles: roles.length > 0 ? roles : ['Player'],
      is_suspended: row.is_suspended,
    };
    req.sessionToken = token;

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  if (req.user.is_suspended) {
    res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!req.user.roles.includes('Admin')) {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}
