import { pool } from '../db/pool';

async function grantAdmin() {
  try {
    const email = 'ararorasmg@gmail.com';
    const userRes = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.log(`User ${email} not found.`);
      return;
    }
    const userId = userRes.rows[0].id;
    await pool.query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'Admin') ON CONFLICT (user_id, role) DO NOTHING",
      [userId]
    );
    console.log(`Successfully granted Admin role to ${email}!`);
  } catch (err) {
    console.error('Error granting admin:', err);
  } finally {
    await pool.end();
  }
}

grantAdmin();
