import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://watchdog_user:secretpassword@localhost:5432/watchdog' });
async function run() {
  await pool.query(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS email_alerts_enabled boolean DEFAULT true;`);
  await pool.query(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS dashboard_alerts_enabled boolean DEFAULT true;`);
  console.log('Migrated');
  process.exit(0);
}
run();
