import { pool } from '../db/pool';

async function deleteUserByEmailOrId(identifier: string) {
  if (!identifier) {
    console.error('Usage: npm run delete:user <email_or_user_id>');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const userRes = await client.query(
      'SELECT id, email, display_name FROM users WHERE id::text = $1 OR email = $1',
      [identifier.trim()]
    );

    if (userRes.rows.length === 0) {
      console.error(`[Delete User]: No user found matching: "${identifier}"`);
      process.exit(1);
    }

    const targetUser = userRes.rows[0];
    const id = targetUser.id;
    console.log(`[Delete User]: Found user "${targetUser.email}" (${id}). Starting deletion...`);

    await client.query('BEGIN');

    // 1. Identify all squads where this user is Captain
    const squadsRes = await client.query('SELECT id FROM squads WHERE captain_id = $1', [id]);
    const squadIds = squadsRes.rows.map((r: { id: string }) => r.id);

    if (squadIds.length > 0) {
      await client.query(
        `DELETE FROM payment_verification_history
         WHERE payment_id IN (SELECT id FROM payments WHERE squad_id = ANY($1) OR captain_id = $2)`,
        [squadIds, id]
      );
      await client.query('DELETE FROM payments WHERE squad_id = ANY($1) OR captain_id = $2', [squadIds, id]);
      await client.query('DELETE FROM tournament_results WHERE squad_id = ANY($1)', [squadIds]);
      await client.query('DELETE FROM registrations WHERE squad_id = ANY($1) OR captain_id = $2', [squadIds, id]);
      await client.query('DELETE FROM squad_members WHERE squad_id = ANY($1)', [squadIds]);
      await client.query('DELETE FROM squads WHERE captain_id = $1', [id]);
    } else {
      await client.query(
        `DELETE FROM payment_verification_history
         WHERE payment_id IN (SELECT id FROM payments WHERE captain_id = $1)`,
        [id]
      );
      await client.query('DELETE FROM payments WHERE captain_id = $1', [id]);
      await client.query('DELETE FROM registrations WHERE captain_id = $1', [id]);
    }

    await client.query('DELETE FROM squad_members WHERE user_id = $1', [id]);
    await client.query('UPDATE payments SET reviewer_id = NULL WHERE reviewer_id = $1', [id]);
    await client.query('UPDATE protected_room_credentials SET release_initiated_by = NULL WHERE release_initiated_by = $1', [id]);
    await client.query('UPDATE tournament_results SET published_by = NULL WHERE published_by = $1', [id]);
    await client.query('UPDATE tournaments SET created_by = NULL WHERE created_by = $1', [id]);
    await client.query('UPDATE email_delivery_logs SET recipient_id = NULL WHERE recipient_id = $1', [id]);
    await client.query('UPDATE audit_logs SET actor_id = NULL WHERE actor_id = $1', [id]);
    await client.query('UPDATE website_settings SET updated_by = NULL WHERE updated_by = $1', [id]);

    await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    await client.query('DELETE FROM otp_challenges WHERE email = $1', [targetUser.email]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');
    console.log(`[Delete User]: Successfully deleted user "${targetUser.email}" from Neon DB.`);
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Delete User Error]:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

const target = process.argv[2];
deleteUserByEmailOrId(target);
