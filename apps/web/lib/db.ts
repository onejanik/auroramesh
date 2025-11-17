import fs from 'fs';
import path from 'path';

const DEFAULT_DB_PATH = process.env.DATABASE_PATH || '/var/lib/auroramesh/data/connectsphere.json';

export type StoredUser = {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  theme?: 'light' | 'dark';
  favorite_tags?: string[];
  is_private?: boolean;
  password_hash: string;
  created_at: string;
};

export type StoredPost = {
  id: number;
  user_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string;
  tags?: string[];
  is_private?: boolean;
  created_at: string;
};

export type StoredStory = {
  id: number;
  user_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  duration_seconds?: number | null;
  created_at: string;
  expires_at: string;
};

export type StoredPollOption = {
  id: string;
  label: string;
  votes: number;
};

export type StoredPoll = {
  id: number;
  user_id: number;
  question: string;
  options: StoredPollOption[];
  created_at: string;
};

export type StoredPollVote = {
  poll_id: number;
  user_id: number;
  option_id: string;
  created_at: string;
};

export type StoredEvent = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  created_at: string;
};

export type StoredEventRsvp = {
  event_id: number;
  user_id: number;
  created_at: string;
};

export type StoredSlideshow = {
  id: number;
  user_id: number;
  media_urls: string[];
  caption?: string;
  created_at: string;
};

export type StoredAudio = {
  id: number;
  user_id: number;
  audio_url: string;
  caption?: string;
  created_at: string;
};

export type StoredReport = {
  id: number;
  reporter_id: number;
  target_type: 'post' | 'poll' | 'event' | 'slideshow' | 'audio' | 'story';
  target_id: number;
  reason: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at?: string;
};

export type StoredComment = {
  id: number;
  post_id?: number | null; // Legacy field, kept for backward compatibility
  target_type?: 'post' | 'poll' | 'event' | 'slideshow' | 'audio';
  target_id?: number;
  user_id: number;
  content: string;
  parent_comment_id?: number | null;
  created_at: string;
};

export type StoredFollow = {
  follower_id: number;
  following_id: number;
  status?: 'pending' | 'approved';
  created_at: string;
};

export type StoredReaction = {
  user_id: number;
  post_id: number;
  created_at: string;
};

export type StoredNotification = {
  id: number;
  user_id: number;
  type: 'like' | 'comment' | 'follow';
  actor_id: number;
  post_id?: number;
  comment_id?: number;
  is_read: boolean;
  created_at: string;
};

export type DatabaseShape = {
  counters: {
    users: number;
    posts: number;
    stories: number;
    polls: number;
    events: number;
    slideshows: number;
    audios: number;
    reports: number;
    comments: number;
    notifications: number;
  };
  users: StoredUser[];
  posts: StoredPost[];
  stories: StoredStory[];
  polls: StoredPoll[];
  poll_votes: StoredPollVote[];
  events: StoredEvent[];
  event_rsvps: StoredEventRsvp[];
  slideshows: StoredSlideshow[];
  audios: StoredAudio[];
  reports: StoredReport[];
  comments: StoredComment[];
  followers: StoredFollow[];
  likes: StoredReaction[];
  bookmarks: StoredReaction[];
  notifications: StoredNotification[];
};

const getDbPath = () => {
  const customPath = process.env.DATABASE_PATH;
  return customPath ? path.resolve(customPath) : DEFAULT_DB_PATH;
};

const readDatabase = (): DatabaseShape => {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const initial: DatabaseShape = {
      counters: { users: 0, posts: 0, stories: 0, polls: 0, events: 0, slideshows: 0, audios: 0, reports: 0, comments: 0, notifications: 0 },
      users: [],
      posts: [],
      stories: [],
      polls: [],
      poll_votes: [],
      events: [],
      event_rsvps: [],
      slideshows: [],
      audios: [],
      reports: [],
      comments: [],
      followers: [],
      likes: [],
      bookmarks: [],
      notifications: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(dbPath, 'utf8');
  const parsed = JSON.parse(raw) as DatabaseShape;
  parsed.users = parsed.users.map((user) => ({
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? '',
    avatar_url: user.avatar_url ?? null,
    bio: user.bio ?? '',
    theme: user.theme === 'dark' ? 'dark' : 'light',
    favorite_tags: Array.isArray(user.favorite_tags) ? user.favorite_tags : [],
    is_private: user.is_private ?? false,
    password_hash: user.password_hash ?? '',
    created_at: user.created_at ?? new Date().toISOString()
  }));
  parsed.posts = parsed.posts?.map((post) => ({
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : [],
    is_private: post.is_private ?? false
  })) ?? [];
  parsed.stories = parsed.stories ?? [];
  parsed.polls = parsed.polls ?? [];
  parsed.poll_votes = parsed.poll_votes ?? [];
  parsed.events = parsed.events ?? [];
  parsed.event_rsvps = parsed.event_rsvps ?? [];
  parsed.slideshows = parsed.slideshows ?? [];
  parsed.audios = parsed.audios ?? [];
  parsed.reports = parsed.reports ?? [];
  parsed.comments = parsed.comments ?? [];
  parsed.followers = (parsed.followers ?? []).map((f) => ({
    ...f,
    status: f.status ?? 'approved'
  }));
  parsed.likes = parsed.likes ?? [];
  parsed.bookmarks = parsed.bookmarks ?? [];
  parsed.counters.stories = parsed.counters.stories ?? 0;
  parsed.counters.polls = parsed.counters.polls ?? 0;
  parsed.counters.events = parsed.counters.events ?? 0;
  parsed.counters.slideshows = parsed.counters.slideshows ?? 0;
  parsed.counters.audios = parsed.counters.audios ?? 0;
  parsed.counters.reports = parsed.counters.reports ?? 0;
  parsed.counters.comments = parsed.counters.comments ?? 0;
  parsed.counters.notifications = parsed.counters.notifications ?? 0;
  parsed.notifications = parsed.notifications ?? [];
  return parsed;
};

const writeDatabase = (db: DatabaseShape) => {
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const updateDatabase = <T>(mutator: (db: DatabaseShape) => T): T => {
  const db = readDatabase();
  const result = mutator(db);
  writeDatabase(db);
  return result;
};

export const readOnlyDatabase = () => readDatabase();

