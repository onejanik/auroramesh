/**
 * Database Adapter
 * 
 * This adapter provides a unified interface for database operations.
 * It checks if PostgreSQL is available and falls back to JSON file storage if not.
 * This allows for a smooth transition from development (JSON) to production (PostgreSQL).
 */

import { isPostgresAvailable } from './dbPostgres';

let usePostgres: boolean | null = null;

export const shouldUsePostgres = async (): Promise<boolean> => {
  if (usePostgres === null) {
    usePostgres = await isPostgresAvailable();
    console.log(`Database mode: ${usePostgres ? 'PostgreSQL' : 'JSON File'}`);
  }
  return usePostgres;
};

// Force check on next call (useful for testing or after configuration changes)
export const resetDatabaseMode = () => {
  usePostgres = null;
};

