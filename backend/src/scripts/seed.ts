import { pool } from '../db/pool';

async function seed() {
  console.log('--- [ARORA ESPORTS] Seeding Initial Platform Data ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Initial Website Settings (Genuine UPI Configuration, Rules, Contacts)
    const settingsCheck = await client.query('SELECT id FROM website_settings WHERE id = $1', ['primary']);
    if (settingsCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO website_settings (
          id, upi_id, upi_payee_name, upi_qr_image_url, support_email, support_phone, rules_text, announcements
        ) VALUES (
          'primary',
          'aroraesports@okaxis',
          'ARORA ESPORTS TOURNAMENT COMMITTEE',
          '/assets/arora_upi_qr.svg',
          'support@aroraesports.com',
          '+91 98765 43210',
          '1. All players must have a minimum Free Fire Level of 40.\n2. Emulators, iPad, and PC setups are strictly forbidden. Mobile phones only.\n3. Hackers, scripting, macro buttons, or game alterations will result in permanent team ban and forfeiture of prize.\n4. Squads must be in the custom room at least 5 minutes prior to match schedule.\n5. Team Captain is solely responsible for reporting accurate UTR and score disputes within 15 minutes of match completion.',
          '🔥 Registration for Bermuda Pro Clash Season 1 is now open! Limited to 12 verified squads.'
        )
      `);
      console.log('[Seed] Primary website settings initialized.');
    }

    // 2. Initial Free Fire Tournaments
    const tournamentsCheck = await client.query('SELECT count(*) FROM tournaments');
    if (parseInt(tournamentsCheck.rows[0].count, 10) === 0) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Open Tournament 1
      const t1 = await client.query(`
        INSERT INTO tournaments (
          title, description, game_title, game_mode, map_name, entry_fee, prize_pool, max_squads,
          registration_deadline, match_time, rules, status, publication_status
        ) VALUES (
          'Bermuda Pro Clash — Season 1',
          'Official 12-Squad Battle Royale tournament hosted by ARORA ESPORTS. 4-player squads compete for the championship title and cash pool.',
          'Free Fire',
          'Battle Royale Squad',
          'Bermuda',
          200.00,
          10000.00,
          12,
          $1,
          $2,
          'Standard competitive rules. 12 squads drop in Bermuda. Point system: 1st=12pts, 2nd=9pts, 3rd=8pts, Kill=1pt.',
          'Registration Open',
          'Published'
        ) RETURNING id
      `, [
        new Date(tomorrow.getTime() - 4 * 60 * 60 * 1000),
        tomorrow
      ]);

      // Create Match for T1
      await client.query(`
        INSERT INTO matches (tournament_id, match_number, scheduled_time, status)
        VALUES ($1, 1, $2, 'Scheduled')
      `, [t1.rows[0].id, tomorrow]);

      // Open Tournament 2
      const t2 = await client.query(`
        INSERT INTO tournaments (
          title, description, game_title, game_mode, map_name, entry_fee, prize_pool, max_squads,
          registration_deadline, match_time, rules, status, publication_status
        ) VALUES (
          'Kalahari Midnight Skirmish',
          'Fast-paced desert combat in Kalahari. High kill multipliers and intense drop battles.',
          'Free Fire',
          'Battle Royale Squad',
          'Kalahari',
          100.00,
          5000.00,
          12,
          $1,
          $2,
          'Gun play only, sniper restrictions apply. 4-player mobile roster mandatory.',
          'Registration Open',
          'Published'
        ) RETURNING id
      `, [
        new Date(nextWeek.getTime() - 6 * 60 * 60 * 1000),
        nextWeek
      ]);

      await client.query(`
        INSERT INTO matches (tournament_id, match_number, scheduled_time, status)
        VALUES ($1, 1, $2, 'Scheduled')
      `, [t2.rows[0].id, nextWeek]);

      console.log('[Seed] Tournaments and match schedules initialized.');
    }

    await client.query('COMMIT');
    console.log('[Seed] Database seeding completed successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Seed Error]:', err.message);
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

if (require.main === module) {
  seed();
}

export { seed };
