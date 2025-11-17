import { Pool, PoolClient } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'auroramesh',
      user: process.env.POSTGRES_USER || 'auroramesh',
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  return pool.query(text, params);
};

export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  return pool.connect();
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Helper function to check if PostgreSQL is available
export const isPostgresAvailable = async (): Promise<boolean> => {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('PostgreSQL not available:', error);
    return false;
  }
};

