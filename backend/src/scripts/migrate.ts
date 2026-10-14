import fs from 'fs';
import path from 'path';
import { pool } from '../db/pool';

async function runMigrations() {
  console.log('--- [ARORA ESPORTS] Running Database Migrations ---');
  const client = await pool.connect();
  try {
    // 1. Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Read migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`[Migrations] Directory not found: ${migrationsDir}`);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const checkRes = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [file]
      );

      if (checkRes.rows.length === 0) {
        console.log(`[Migrations] Applying ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[Migrations] Successfully applied: ${file}`);
      } else {
        console.log(`[Migrations] Already applied: ${file}`);
      }
    }
    console.log('[Migrations] Database schema is up to date.');
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Migrations Error]:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
