import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL
  });
}

export const query = async (text: string, params?: any[]) => {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }
  return pool.query(text, params);
};

export const initDb = async () => {
  if (!pool) {
    console.log('Skipping DB initialization: DATABASE_URL not set');
    return;
  }
  
  try {
    const schemaPath = path.join(process.cwd(), 'src/db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('Database schema initialized');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
