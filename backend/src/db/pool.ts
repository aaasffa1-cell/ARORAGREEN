import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  'postgresql://postgres:postgres@localhost:5432/arora_esports';

// Handle SSL for Neon PostgreSQL, Supabase, Vercel Postgres, and cloud hosted DBs
const isCloudDatabase = 
  connectionString.includes('neon.tech') || 
  connectionString.includes('supabase.co') || 
  connectionString.includes('vercel-storage.com') ||
  connectionString.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production' ||
  !!process.env.VERCEL;

export const pool = new Pool({
  connectionString,
  ssl: isCloudDatabase && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : undefined,
  max: process.env.VERCEL ? 5 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err: any) => {
  console.error('[DB Pool Error]: Unexpected error on idle client', err.message);
});

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 500) {
    console.warn(`[Slow Query]: ${text} (${duration}ms)`);
  }
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
