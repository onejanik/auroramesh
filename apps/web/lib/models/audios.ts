import { readOnlyDatabase, updateDatabase, type StoredAudio } from '../db';
import type { AudioNote } from '../../types/audio';

type CreatePayload = {
  userId: number;
  audioUrl: string;
  caption?: string;
};

const toAudioNote = (
  note: StoredAudio,
  author: { id: number; name: string | null; avatar_url: string | null }
): AudioNote => ({
  id: note.id,
  audioUrl: note.audio_url,
  caption: note.caption,
  createdAt: note.created_at,
  author: {
    id: author.id,
    name: author.name,
    avatarUrl: author.avatar_url
  }
});

export const createAudioNote = ({ userId, audioUrl, caption }: CreatePayload): AudioNote =>
  updateDatabase((db) => {
    const author = db.users.find((user) => user.id === userId);
    if (!author) throw new Error('User not found');
    const note: StoredAudio = {
      id: ++db.counters.audios,
      user_id: userId,
      audio_url: audioUrl,
      caption,
      created_at: new Date().toISOString()
    };
    db.audios.push(note);
    return toAudioNote(note, author);
  });

export const listAudioNotes = (viewerId?: number, excludeUserId?: number, userId?: number): AudioNote[] => {
  const db = readOnlyDatabase();
  return db.audios
    .filter((note) => {
      // Filter by userId
      if (userId !== undefined && note.user_id !== userId) return false;
      
      // Filter by excludeUserId
      if (excludeUserId && note.user_id === excludeUserId) return false;
      
      // Privacy filter: check if viewer can see content from private accounts
      if (viewerId) {
        // Always show own audio notes
        if (note.user_id === viewerId) return true;
        
        const author = db.users.find((u) => u.id === note.user_id);
        if (!author) return false;
        
        // Check if author's account is private
        if (author.is_private) {
          // Check if viewer is following the author (approved follows only)
          const isFollowing = db.followers.some(
            (f) => f.follower_id === viewerId && f.following_id === note.user_id && f.status === 'approved'
          );
          return isFollowing;
        }
      }
      
      return true;
    })
    .map((note) => {
      const author = db.users.find((user) => user.id === note.user_id);
      return author ? toAudioNote(note, author) : null;
    })
    .filter(Boolean) as AudioNote[];
};

