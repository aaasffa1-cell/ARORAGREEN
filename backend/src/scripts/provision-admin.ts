import { pool } from '../db/pool';

async function provisionAdmin() {
  const emailArg = process.argv[2]?.trim().toLowerCase();

  if (!emailArg || !emailArg.includes('@')) {
    console.error('ERROR: You must supply a valid email address.');
    console.log('Usage: npm run provision:admin -- <email>');
    console.log('Example: npm run provision:admin -- admin@aroraesports.com');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if user exists or create them
    let userRes = await client.query('SELECT id, email, display_name FROM users WHERE email = $1', [emailArg]);
    let userId: string;

    if (userRes.rows.length === 0) {
      console.log(`[Provision Admin] Creating user account for ${emailArg}...`);
      const insertUser = await client.query(
        `INSERT INTO users (email, display_name) 
         VALUES ($1, $2) 
         RETURNING id, email`,
        [emailArg, 'Arora Admin']
      );
      userId = insertUser.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
      console.log(`[Provision Admin] Found existing user account: ${userId} (${emailArg})`);
    }

    // 2. Ensure Player role exists
    await client.query(
      `INSERT INTO user_roles (user_id, role) 
       VALUES ($1, 'Player') 
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId]
    );

    // 3. Grant Admin role server-side
    const roleRes = await client.query(
      `INSERT INTO user_roles (user_id, role) 
       VALUES ($1, 'Admin') 
       ON CONFLICT (user_id, role) DO NOTHING 
       RETURNING id`,
      [userId]
    );

    // 4. Record privilege assignment in audit log
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, target_entity, target_id, metadata)
       VALUES ($1, 'PROVISION_ADMIN_ROLE', 'user_roles', $2, $3)`,
      [
        userId,
        userId,
        JSON.stringify({
          email: emailArg,
          role: 'Admin',
          method: 'CLI_PROVISION_SCRIPT',
          alreadyHadRole: roleRes.rows.length === 0,
        }),
      ]
    );

    await client.query('COMMIT');

    if (roleRes.rows.length > 0) {
      console.log(`[Provision Admin] SUCCESS: User ${emailArg} has been granted the 'Admin' role.`);
    } else {
      console.log(`[Provision Admin] NOTICE: User ${emailArg} already possessed the 'Admin' role. Privileges verified.`);
    }
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Provision Admin Error]:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

provisionAdmin();
