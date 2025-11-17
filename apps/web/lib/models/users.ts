import { readOnlyDatabase, updateDatabase, type DatabaseShape, type StoredUser } from '../db';
import { createNotification } from './notifications';

export type UserRecord = {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  theme: 'light' | 'dark';
  favorite_tags: string[];
  is_private?: boolean;
};

const toRecord = (user: StoredUser): UserRecord => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar_url: user.avatar_url,
  bio: user.bio ?? '',
  theme: user.theme === 'dark' ? 'dark' : 'light',
  favorite_tags: Array.isArray(user.favorite_tags) ? user.favorite_tags : [],
  is_private: user.is_private ?? false
});

export type UserStats = {
  followerCount: number;
  followingCount: number;
  postCount: number;
  totalLikes: number;
};

export const createUser = ({
  email,
  name,
  passwordHash
}: {
  email: string;
  name: string;
  passwordHash: string;
}): UserRecord =>
  updateDatabase((db) => {
    const newUser: StoredUser = {
      id: ++db.counters.users,
      email,
      name: name.trim(),
      avatar_url: null,
      bio: '',
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      theme: 'light',
      favorite_tags: []
    };
    db.users.push(newUser);
    return toRecord(newUser);
  });

export const getUserById = (id: number): UserRecord | undefined => {
  const db = readOnlyDatabase();
  const user = db.users.find((u) => u.id === id);
  return user ? toRecord(user) : undefined;
};

export const getUserWithPasswordByEmail = (email: string): StoredUser | undefined => {
  const db = readOnlyDatabase();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
};

export const getUserByName = (name: string): StoredUser | undefined => {
  const db = readOnlyDatabase();
  return db.users.find((u) => u.name.toLowerCase() === name.toLowerCase());
};

export const generateUsernameVariations = (baseName: string, count = 5): string[] => {
  const db = readOnlyDatabase();
  const existingNames = new Set(db.users.map((u) => u.name.toLowerCase()));
  const suggestions: string[] = [];
  
  const base = baseName.trim().replace(/\s+/g, '_');
  
  // Try with numbers
  for (let i = 1; suggestions.length < count && i <= 999; i++) {
    const candidate = `${base}${i}`;
    if (!existingNames.has(candidate.toLowerCase())) {
      suggestions.push(candidate);
    }
  }
  
  // Try with underscores and numbers
  if (suggestions.length < count) {
    for (let i = 1; suggestions.length < count && i <= 999; i++) {
      const candidate = `${base}_${i}`;
      if (!existingNames.has(candidate.toLowerCase())) {
        suggestions.push(candidate);
      }
    }
  }
  
  // Try with random suffix
  if (suggestions.length < count) {
    for (let i = 0; suggestions.length < count && i < 10; i++) {
      const randomSuffix = Math.floor(Math.random() * 9999);
      const candidate = `${base}_${randomSuffix}`;
      if (!existingNames.has(candidate.toLowerCase())) {
        suggestions.push(candidate);
      }
    }
  }
  
  return suggestions;
};

const sanitizeTags = (tags?: string[]) =>
  Array.from(
    new Set((tags ?? []).map((tag) => tag.toLowerCase().replace(/[^a-z0-9-_]/gi, '')).filter((tag) => tag.length))
  ).slice(0, 10);

export const updateUserProfile = (
  id: number,
  {
    name,
    bio,
    theme,
    favoriteTags,
    avatarUrl,
    isPrivate
  }: { name?: string; bio?: string; theme?: 'light' | 'dark'; favoriteTags?: string[]; avatarUrl?: string | null; isPrivate?: boolean }
) =>
  updateDatabase((db) => {
    const user = db.users.find((u) => u.id === id);
    if (!user) return undefined;
    if (typeof name === 'string') user.name = name;
    if (typeof bio === 'string') user.bio = bio;
    if (theme === 'light' || theme === 'dark') {
      user.theme = theme;
    }
    if (Array.isArray(favoriteTags)) {
      user.favorite_tags = sanitizeTags(favoriteTags);
    }
    if (typeof avatarUrl === 'string' || avatarUrl === null) {
      user.avatar_url = avatarUrl;
    }
    if (typeof isPrivate === 'boolean') {
      user.is_private = isPrivate;
    }
    return toRecord(user);
  });

export const searchUsers = (query: string, limit = 20): UserRecord[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const db = readOnlyDatabase();
  return db.users
    .filter((user) => user.name.toLowerCase().includes(normalized))
    .slice(0, limit)
    .map(toRecord);
};

export const getUserStats = (userId: number): UserStats => {
  const db = readOnlyDatabase();
  const posts = db.posts.filter((post) => post.user_id === userId);
  const postIds = new Set(posts.map((post) => post.id));
  const followerCount = db.followers.filter((f) => f.following_id === userId && f.status === 'approved').length;
  const followingCount = db.followers.filter((f) => f.follower_id === userId && f.status === 'approved').length;
  const totalLikes = db.likes.filter((like) => postIds.has(like.post_id)).length;

  return {
    followerCount,
    followingCount,
    postCount: posts.length,
    totalLikes
  };
};

export const isFollowingUser = (followerId: number, followingId: number): boolean => {
  const db = readOnlyDatabase();
  return db.followers.some(
    (follow) => follow.follower_id === followerId && follow.following_id === followingId && follow.status === 'approved'
  );
};

export const getFollowStatus = (followerId: number, followingId: number): 'approved' | 'pending' | 'none' => {
  const db = readOnlyDatabase();
  const follow = db.followers.find((f) => f.follower_id === followerId && f.following_id === followingId);
  if (!follow) return 'none';
  return follow.status === 'pending' ? 'pending' : 'approved';
};

/**
 * Check if a user can view a private account's content
 * Returns true if:
 * - The account is not private
 * - The viewer is the account owner
 * - The viewer is a follower of the private account
 */
export const canViewPrivateAccount = (viewerId: number, targetUserId: number): boolean => {
  // Owner can always see their own content
  if (viewerId === targetUserId) return true;
  
  const db = readOnlyDatabase();
  const targetUser = db.users.find((u) => u.id === targetUserId);
  
  // If account is not private, anyone can view
  if (!targetUser || !targetUser.is_private) return true;
  
  // Check if viewer is following the private account
  return db.followers.some(
    (f) => f.follower_id === viewerId && f.following_id === targetUserId
  );
};

const followerResponse = (db: DatabaseShape, targetId: number, isFollowing: boolean) => ({
  followerCount: db.followers.filter((f) => f.following_id === targetId && f.status === 'approved').length,
  isFollowing
});

export const followUser = (followerId: number, targetId: number) => {
  if (followerId === targetId) {
    throw new Error('Cannot follow yourself');
  }
  return updateDatabase((db) => {
    const targetUser = db.users.find((u) => u.id === targetId);
    if (!targetUser) {
      throw new Error('User not found');
    }
    
    const exists = db.followers.some((f) => f.follower_id === followerId && f.following_id === targetId);
    if (!exists) {
      // Check if target account is private
      const status = targetUser.is_private ? 'pending' : 'approved';
      
      db.followers.push({
        follower_id: followerId,
        following_id: targetId,
        status,
        created_at: new Date().toISOString()
      });
      
      // Only create notification if approved (public account) or for follow request
      if (status === 'approved') {
        createNotification({
          userId: targetId,
          type: 'follow',
          actorId: followerId
        });
      }
    }
    
    // Only count as following if approved
    const approvedFollowExists = db.followers.some(
      (f) => f.follower_id === followerId && f.following_id === targetId && f.status === 'approved'
    );
    
    return {
      ...followerResponse(db, targetId, approvedFollowExists),
      isPending: db.followers.some(
        (f) => f.follower_id === followerId && f.following_id === targetId && f.status === 'pending'
      )
    };
  });
};

export const unfollowUser = (followerId: number, targetId: number) =>
  updateDatabase((db) => {
    const idx = db.followers.findIndex((f) => f.follower_id === followerId && f.following_id === targetId);
    if (idx !== -1) {
      db.followers.splice(idx, 1);
    }
    return { ...followerResponse(db, targetId, false), isPending: false };
  });

export const approveFollowRequest = (userId: number, followerId: number) =>
  updateDatabase((db) => {
    const follow = db.followers.find(
      (f) => f.follower_id === followerId && f.following_id === userId && f.status === 'pending'
    );
    if (follow) {
      follow.status = 'approved';
      
      // Create notification for approved follow
      createNotification({
        userId: followerId,
        type: 'follow',
        actorId: userId
      });
    }
    return { success: !!follow };
  });

export const rejectFollowRequest = (userId: number, followerId: number) =>
  updateDatabase((db) => {
    const idx = db.followers.findIndex(
      (f) => f.follower_id === followerId && f.following_id === userId && f.status === 'pending'
    );
    if (idx !== -1) {
      db.followers.splice(idx, 1);
    }
    return { success: idx !== -1 };
  });

export const listFollowRequests = (userId: number) => {
  const db = readOnlyDatabase();
  const requests = db.followers.filter((f) => f.following_id === userId && f.status === 'pending');
  
  return requests.map((req) => {
    const follower = db.users.find((u) => u.id === req.follower_id);
    return follower ? {
      id: req.follower_id,
      name: follower.name,
      avatar_url: follower.avatar_url,
      created_at: req.created_at
    } : null;
  }).filter(Boolean);
};

