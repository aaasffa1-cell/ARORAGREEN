import { pool } from '../db/pool';

async function updateSettings() {
  console.log('--- Updating Website Settings with User Provided Details ---');
  const client = await pool.connect();
  try {
    // Add support_telegram column if not exists
    await client.query(`
      ALTER TABLE website_settings 
      ADD COLUMN IF NOT EXISTS support_telegram TEXT;
    `);

    // Upsert primary settings
    const result = await client.query(`
      INSERT INTO website_settings (
        id, upi_id, upi_payee_name, upi_qr_image_url, support_email, support_phone, support_telegram, rules_text, announcements, updated_at
      ) VALUES (
        'primary',
        '9010418179-2.wallet@phonepe',
        'ARORA ESPORTS (PhonePe)',
        '/assets/phonepe_upi_qr.jpg',
        'aaasffa1@gmail.com',
        '9010418179',
        'https://t.me/gaiusmorgan901',
        '1. All players must have a minimum Free Fire Level of 40.\n2. Emulators, iPad, and PC setups are strictly forbidden. Mobile phones only.\n3. Hackers, scripting, macro buttons, or game alterations will result in permanent team ban.\n4. Squads must be in the custom room at least 5 minutes prior to match schedule.\n5. Team Captain is solely responsible for reporting accurate UTR.',
        '🔥 Welcome to ARORA ESPORTS! Official UPI: 9010418179-2.wallet@phonepe | Support Telegram: https://t.me/gaiusmorgan901',
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        upi_id = EXCLUDED.upi_id,
        upi_payee_name = EXCLUDED.upi_payee_name,
        upi_qr_image_url = EXCLUDED.upi_qr_image_url,
        support_email = EXCLUDED.support_email,
        support_phone = EXCLUDED.support_phone,
        support_telegram = EXCLUDED.support_telegram,
        announcements = EXCLUDED.announcements,
        updated_at = NOW()
      RETURNING *;
    `);

    console.log('✅ Settings updated in Neon Database successfully:');
    console.log(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to update settings:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSettings();
