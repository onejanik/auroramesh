import { readOnlyDatabase, updateDatabase, type StoredEvent, type StoredEventRsvp } from '../db';
import type { Event } from '../../types/event';

type CreatePayload = {
  userId: number;
  title: string;
  description: string;
  location: string;
  startsAt: string;
};

const toEvent = (
  event: StoredEvent,
  author: { id: number; name: string | null; avatar_url: string | null },
  rsvps: StoredEventRsvp[],
  viewerId?: number
): Event => ({
  id: event.id,
  title: event.title,
  description: event.description,
  location: event.location,
  startsAt: event.starts_at,
  createdAt: event.created_at,
  author: {
    id: author.id,
    name: author.name,
    avatarUrl: author.avatar_url
  },
  stats: {
    rsvps: rsvps.filter((entry) => entry.event_id === event.id).length
  },
  viewerRsvp: viewerId ? rsvps.some((entry) => entry.event_id === event.id && entry.user_id === viewerId) : undefined
});

export const createEvent = ({ userId, title, description, location, startsAt }: CreatePayload): Event =>
  updateDatabase((db) => {
    const author = db.users.find((user) => user.id === userId);
    if (!author) throw new Error('User not found');

    const event: StoredEvent = {
      id: ++db.counters.events,
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      starts_at: new Date(startsAt).toISOString(),
      created_at: new Date().toISOString()
    };

    db.events.push(event);
    return toEvent(event, author, db.event_rsvps, userId);
  });

export const listEvents = (viewerId?: number, excludeUserId?: number): Event[] => {
  const db = readOnlyDatabase();
  return db.events
    .filter((event) => {
      // Filter by excludeUserId
      if (excludeUserId && event.user_id === excludeUserId) return false;
      
      // Privacy filter: check if viewer can see content from private accounts
      if (viewerId) {
        // Always show own events
        if (event.user_id === viewerId) return true;
        
        const author = db.users.find((u) => u.id === event.user_id);
        if (!author) return false;
        
        // Check if author's account is private
        if (author.is_private) {
          // Check if viewer is following the author (approved follows only)
          const isFollowing = db.followers.some(
            (f) => f.follower_id === viewerId && f.following_id === event.user_id && f.status === 'approved'
          );
          return isFollowing;
        }
      }
      
      return true;
    })
    .map((event) => {
      const author = db.users.find((user) => user.id === event.user_id);
      return author ? toEvent(event, author, db.event_rsvps, viewerId) : null;
    })
    .filter(Boolean) as Event[];
};

export const rsvpEvent = (eventId: number, userId: number, attending: boolean) =>
  updateDatabase((db) => {
    const event = db.events.find((entry) => entry.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    const existingIndex = db.event_rsvps.findIndex((entry) => entry.event_id === eventId && entry.user_id === userId);
    if (attending && existingIndex === -1) {
      db.event_rsvps.push({
        event_id: eventId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
    }
    if (!attending && existingIndex !== -1) {
      db.event_rsvps.splice(existingIndex, 1);
    }
    const author = db.users.find((user) => user.id === event.user_id);
    if (!author) throw new Error('Author not found');
    return toEvent(event, author, db.event_rsvps, userId);
  });

