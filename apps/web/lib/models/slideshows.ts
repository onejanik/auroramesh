import { readOnlyDatabase, updateDatabase, type StoredSlideshow } from '../db';
import type { Slideshow } from '../../types/slideshow';

type CreatePayload = {
  userId: number;
  mediaUrls: string[];
  caption?: string;
};

const toSlideshow = (
  slideshow: StoredSlideshow,
  author: { id: number; name: string | null; avatar_url: string | null }
): Slideshow => ({
  id: slideshow.id,
  caption: slideshow.caption,
  mediaUrls: slideshow.media_urls,
  createdAt: slideshow.created_at,
  author: {
    id: author.id,
    name: author.name,
    avatarUrl: author.avatar_url
  }
});

export const createSlideshow = ({ userId, mediaUrls, caption }: CreatePayload): Slideshow =>
  updateDatabase((db) => {
    const author = db.users.find((user) => user.id === userId);
    if (!author) throw new Error('User not found');
    if (!mediaUrls.length) {
      throw new Error('Mindestens ein Bild erforderlich');
    }
    const slideshow: StoredSlideshow = {
      id: ++db.counters.slideshows,
      user_id: userId,
      media_urls: mediaUrls,
      caption,
      created_at: new Date().toISOString()
    };
    db.slideshows.push(slideshow);
    return toSlideshow(slideshow, author);
  });

export const listSlideshows = (viewerId?: number, excludeUserId?: number): Slideshow[] => {
  const db = readOnlyDatabase();
  return db.slideshows
    .filter((slideshow) => {
      // Filter by excludeUserId
      if (excludeUserId && slideshow.user_id === excludeUserId) return false;
      
      // Privacy filter: check if viewer can see content from private accounts
      if (viewerId) {
        // Always show own slideshows
        if (slideshow.user_id === viewerId) return true;
        
        const author = db.users.find((u) => u.id === slideshow.user_id);
        if (!author) return false;
        
        // Check if author's account is private
        if (author.is_private) {
          // Check if viewer is following the author (approved follows only)
          const isFollowing = db.followers.some(
            (f) => f.follower_id === viewerId && f.following_id === slideshow.user_id && f.status === 'approved'
          );
          return isFollowing;
        }
      }
      
      return true;
    })
    .map((slideshow) => {
      const author = db.users.find((user) => user.id === slideshow.user_id);
      return author ? toSlideshow(slideshow, author) : null;
    })
    .filter(Boolean) as Slideshow[];
};

