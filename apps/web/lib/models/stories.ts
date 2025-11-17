import { updateDatabase, type StoredStory } from '../db';
import type { Story } from '../../types/story';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

const toStory = (
  story: StoredStory,
  author: { id: number; name: string | null; avatar_url: string | null }
): Story => ({
  id: story.id,
  mediaUrl: story.media_url,
  mediaType: story.media_type,
  caption: story.caption,
  createdAt: story.created_at,
  expiresAt: story.expires_at,
  durationSeconds: story.duration_seconds ?? null,
  author: {
    id: author.id,
    name: author.name,
    avatarUrl: author.avatar_url
  }
});

const purgeExpiredStories = (stories: StoredStory[]) => {
  const now = Date.now();
  return stories.filter((story) => new Date(story.expires_at).getTime() > now);
};

type CreatePayload = {
  userId: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  durationSeconds?: number;
};

export const createStory = ({ userId, mediaUrl, mediaType, caption, durationSeconds }: CreatePayload): Story =>
  updateDatabase((db) => {
    const author = db.users.find((user) => user.id === userId);
    if (!author) {
      throw new Error('User not found');
    }

    db.stories = purgeExpiredStories(db.stories);

    const now = new Date();
    const story: StoredStory = {
      id: ++db.counters.stories,
      user_id: userId,
      media_url: mediaUrl,
      media_type: mediaType,
      caption,
      duration_seconds: typeof durationSeconds === 'number' ? durationSeconds : undefined,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + STORY_TTL_MS).toISOString()
    };

    db.stories.push(story);
    return toStory(story, author);
  });

export const listActiveStories = (): Story[] =>
  updateDatabase((db) => {
    db.stories = purgeExpiredStories(db.stories);
    return db.stories
      .map((story) => {
        const author = db.users.find((user) => user.id === story.user_id);
        return author ? toStory(story, author) : null;
      })
      .filter(Boolean) as Story[];
  });

