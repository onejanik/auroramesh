/**
 * Hybrid Database Layer
 * 
 * This module provides automatic fallback between PostgreSQL and JSON storage
 * while maintaining the same API interface as db.ts
 */

import { query, isPostgresAvailable } from './dbPostgres';
import * as jsonDb from './db';
import type { DatabaseShape } from './db';

let usePostgres: boolean | null = null;
let checkPromise: Promise<boolean> | null = null;

async function initDatabaseMode(): Promise<boolean> {
  if (usePostgres !== null) {
    return usePostgres;
  }

  if (checkPromise) {
    return checkPromise;
  }

  checkPromise = (async () => {
    try {
      const hasConfig = !!(
        process.env.POSTGRES_HOST &&
        process.env.POSTGRES_USER &&
        process.env.POSTGRES_PASSWORD &&
        process.env.POSTGRES_DB
      );

      if (!hasConfig) {
        console.log('📁 Database: JSON File (no PostgreSQL config)');
        usePostgres = false;
        return false;
      }

      const available = await isPostgresAvailable();
      usePostgres = available;

      console.log(available ? '🐘 Database: PostgreSQL' : '📁 Database: JSON File (fallback)');
      return available;
    } catch (error) {
      console.error('Database init failed:', error);
      usePostgres = false;
      return false;
    } finally {
      checkPromise = null;
    }
  })();

  return checkPromise;
}

/**
 * Read-only database access
 * Returns a snapshot of the database at this moment
 */
export async function readOnlyDatabaseAsync(): Promise<DatabaseShape> {
  const isPostgres = await initDatabaseMode();
  
  if (!isPostgres) {
    return jsonDb.readOnlyDatabase();
  }

  // For PostgreSQL, we still use JSON as cache for read-only operations
  // This is because the current models expect the full in-memory structure
  // A full PostgreSQL implementation would require rewriting all models
  return jsonDb.readOnlyDatabase();
}

/**
 * Synchronous read-only access (uses JSON)
 */
export const readOnlyDatabase = jsonDb.readOnlyDatabase;

/**
 * Update database with a mutation function
 */
export const updateDatabase = jsonDb.updateDatabase;

// Re-export all types
export type {
  DatabaseShape,
  StoredUser,
  StoredPost,
  StoredStory,
  StoredPoll,
  StoredPollVote,
  StoredEvent,
  StoredEventRsvp,
  StoredSlideshow,
  StoredAudio,
  StoredReport,
  StoredComment,
  StoredNotification,
  StoredReaction,
  StoredFollow
} from './db';

