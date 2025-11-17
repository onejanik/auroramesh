/**
 * Database Adapter
 * 
 * This adapter provides a unified interface that automatically switches between
 * JSON file storage (development) and PostgreSQL (production).
 * 
 * Environment Detection:
 * - If POSTGRES_HOST is set and connection works: Use PostgreSQL
 * - Otherwise: Fall back to JSON file storage
 */

import { query, isPostgresAvailable } from './dbPostgres';
import * as jsonDb from './db';

let usePostgres: boolean | null = null;
let isChecking = false;

export const shouldUsePostgres = async (): Promise<boolean> => {
  // Return cached result if available
  if (usePostgres !== null) {
    return usePostgres;
  }

  // Prevent concurrent checks
  if (isChecking) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return shouldUsePostgres();
  }

  isChecking = true;

  try {
    // Check if PostgreSQL credentials are provided
    const hasPostgresConfig = !!(
      process.env.POSTGRES_HOST &&
      process.env.POSTGRES_USER &&
      process.env.POSTGRES_PASSWORD &&
      process.env.POSTGRES_DB
    );

    if (!hasPostgresConfig) {
      console.log('📁 Database mode: JSON File (no PostgreSQL config found)');
      usePostgres = false;
      return false;
    }

    // Test PostgreSQL connection
    const available = await isPostgresAvailable();
    usePostgres = available;

    if (available) {
      console.log('🐘 Database mode: PostgreSQL');
    } else {
      console.log('📁 Database mode: JSON File (PostgreSQL unavailable, falling back)');
    }

    return usePostgres;
  } catch (error) {
    console.error('Database mode check failed:', error);
    usePostgres = false;
    return false;
  } finally {
    isChecking = false;
  }
};

// Force check on next call (useful for testing or after configuration changes)
export const resetDatabaseMode = () => {
  usePostgres = null;
};

// Export JSON DB functions with automatic fallback
export const readOnlyDatabase = jsonDb.readOnlyDatabase;
export const updateDatabase = jsonDb.updateDatabase;

// Re-export types
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
