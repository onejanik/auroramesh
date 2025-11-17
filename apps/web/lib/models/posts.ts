import { readOnlyDatabase, updateDatabase, type DatabaseShape, type StoredPost, type StoredReaction } from '../db';
import type { Post } from '../../types/post';
import { createNotification } from './notifications';

type CreatePayload = {
  userId: number;
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  tags?: string[];
};

type ReactionMaps = {
  likeCounts: Map<number, number>;
  saveCounts: Map<number, number>;
  viewerLikes: Set<number>;
  viewerSaves: Set<number>;
  hasViewer: boolean;
};

const buildReactionMaps = (db: DatabaseShape, viewerId?: number): ReactionMaps => {
  const likeCounts = new Map<number, number>();
  const saveCounts = new Map<number, number>();
  const viewerLikes = new Set<number>();
  const viewerSaves = new Set<number>();
  const hasViewer = typeof viewerId === 'number';

  const accumulate = (map: Map<number, number>, reaction: StoredReaction) => {
    const current = map.get(reaction.post_id) ?? 0;
    map.set(reaction.post_id, current + 1);
  };

  db.likes.forEach((reaction) => {
    accumulate(likeCounts, reaction);
    if (viewerId && reaction.user_id === viewerId) {
      viewerLikes.add(reaction.post_id);
    }
  });
  db.bookmarks.forEach((reaction) => {
    accumulate(saveCounts, reaction);
    if (viewerId && reaction.user_id === viewerId) {
      viewerSaves.add(reaction.post_id);
    }
  });

  return { likeCounts, saveCounts, viewerLikes, viewerSaves, hasViewer };
};

const buildCommentCounts = (db: DatabaseShape) => {
  const counts = new Map<number, number>();
  db.comments.forEach((comment) => {
    const current = counts.get(comment.post_id) ?? 0;
    counts.set(comment.post_id, current + 1);
  });
  return counts;
};

const toPost = (
  post: StoredPost,
  author: { id: number; name: string | null; avatar_url: string | null },
  maps?: ReactionMaps,
  commentCounts?: Map<number, number>,
  viewerId?: number
): Post => ({
  id: post.id,
  mediaUrl: post.media_url,
  mediaType: post.media_type,
  caption: post.caption,
  tags: post.tags ?? [],
  isPrivate: post.is_private ?? false,
  createdAt: post.created_at,
  author: {
    id: author.id,
    name: author.name,
    avatarUrl: author.avatar_url
  },
  stats: {
    likes: maps?.likeCounts.get(post.id) ?? 0,
    saves: maps?.saveCounts.get(post.id) ?? 0
  },
  viewer: maps?.hasViewer
    ? {
        liked: maps.viewerLikes.has(post.id),
        saved: maps.viewerSaves.has(post.id),
        isOwner: viewerId === post.user_id
      }
    : undefined,
  commentCount: commentCounts?.get(post.id) ?? 0
});

const sanitizeTags = (tags?: string[]) =>
  Array.from(
    new Set((tags ?? []).map((tag) => tag.toLowerCase().replace(/[^a-z0-9-_]/gi, '')).filter((tag) => tag.length))
  ).slice(0, 10);

export const createPost = ({ userId, mediaUrl, mediaType, caption, tags }: CreatePayload): Post =>
  updateDatabase((db) => {
    const author = db.users.find((u) => u.id === userId);
    if (!author) {
      throw new Error('User not found');
    }

    const normalizedTags = sanitizeTags(tags);

    const newPost: StoredPost = {
      id: ++db.counters.posts,
      user_id: userId,
      media_url: mediaUrl,
      media_type: mediaType === 'video' ? 'video' : 'image',
      caption: caption ?? '',
      tags: normalizedTags,
      created_at: new Date().toISOString()
    };

    db.posts.push(newPost);
    return {
      id: newPost.id,
      mediaUrl: newPost.media_url,
      mediaType: newPost.media_type,
      caption: newPost.caption,
      tags: newPost.tags ?? [],
      createdAt: newPost.created_at,
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatar_url
      },
      stats: {
        likes: 0,
        saves: 0
      },
      viewer: {
        liked: false,
        saved: false
      },
      commentCount: 0
    };
  });

export const getPostById = (id: number, viewerId?: number): Post | undefined => {
  const db = readOnlyDatabase();
  const post = db.posts.find((p) => p.id === id);
  if (!post) return undefined;
  const author = db.users.find((u) => u.id === post.user_id);
  if (!author) return undefined;
  const maps = buildReactionMaps(db, viewerId);
  const commentCounts = buildCommentCounts(db);
  return toPost(post, author, maps, commentCounts, viewerId);
};

type ListOptions = {
  userId?: number;
  excludeUserId?: number;
  viewerId?: number;
  preferredTags?: string[];
};

export const listPosts = (
  limit = 20,
  cursor?: string,
  options?: ListOptions
): { posts: Post[]; nextCursor: string | null } => {
  const db = readOnlyDatabase();
  let posts = [...db.posts].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  if (cursor) {
    posts = posts.filter((post) => post.created_at < cursor);
  }

  if (typeof options?.userId === 'number') {
    posts = posts.filter((post) => post.user_id === options.userId);
  } else if (typeof options?.excludeUserId === 'number') {
    posts = posts.filter((post) => post.user_id !== options.excludeUserId);
  }
  
  // Privacy filter: exclude private posts and posts from private accounts
  if (typeof options?.viewerId === 'number') {
    posts = posts.filter((post) => {
      // Always show own posts
      if (post.user_id === options.viewerId) return true;
      
      const author = db.users.find((u) => u.id === post.user_id);
      if (!author) return false;
      
      // Check if post is private
      if (post.is_private) {
        // Check if viewer is following the author (approved follows only)
        const isFollowing = db.followers.some(
          (f) => f.follower_id === options.viewerId && f.following_id === post.user_id && f.status === 'approved'
        );
        return isFollowing;
      }
      
      // Check if author's account is private
      if (author.is_private) {
        // Check if viewer is following the author (approved follows only)
        const isFollowing = db.followers.some(
          (f) => f.follower_id === options.viewerId && f.following_id === post.user_id && f.status === 'approved'
        );
        return isFollowing;
      }
      
      return true;
    });
  }
  
  if (options?.preferredTags && options.preferredTags.length) {
    const tagged = posts.filter((post) => {
      const postTags = post.tags ?? [];
      return postTags.some((tag) => options.preferredTags!.includes(tag));
    });
    if (tagged.length) {
      posts = tagged;
    }
  }

  const reactionMaps = buildReactionMaps(db, options?.viewerId);
  const commentCounts = buildCommentCounts(db);

  const chunk = posts.slice(0, limit + 1);
  let nextCursor: string | null = null;
  if (chunk.length > limit) {
    const last = chunk.pop()!;
    nextCursor = last.created_at;
  }

  const mapped = chunk
    .map((post) => {
      const author = db.users.find((u) => u.id === post.user_id);
      return author ? toPost(post, author, reactionMaps, commentCounts, options?.viewerId) : null;
    })
    .filter(Boolean) as Post[];

  return { posts: mapped, nextCursor };
};

export const deletePost = (id: number, requestingUserId: number, isAdmin: boolean = false) =>
  updateDatabase((db) => {
    const post = db.posts.find((p) => p.id === id);
    if (!post) return { changes: 0 };
    
    // Only allow deletion if user is owner or admin
    if (post.user_id !== requestingUserId && !isAdmin) {
      return { changes: 0 };
    }
    
    const index = db.posts.findIndex((p) => p.id === id);
    if (index === -1) return { changes: 0 };
    db.posts.splice(index, 1);
    return { changes: 1 };
  });

export const updatePostPrivacy = (id: number, userId: number, isPrivate: boolean) =>
  updateDatabase((db) => {
    const post = db.posts.find((p) => p.id === id && p.user_id === userId);
    if (!post) return { success: false };
    post.is_private = isPrivate;
    return { success: true, isPrivate };
  });

const setReaction = (kind: 'likes' | 'bookmarks', postId: number, userId: number, active: boolean) =>
  updateDatabase((db) => {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const collection: StoredReaction[] = db[kind];
    const existingIndex = collection.findIndex((entry) => entry.post_id === postId && entry.user_id === userId);

    if (active && existingIndex === -1) {
      collection.push({
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      
      // Create notification for likes only
      if (kind === 'likes') {
        createNotification({
          userId: post.user_id,
          type: 'like',
          actorId: userId,
          postId
        });
      }
    } else if (!active && existingIndex !== -1) {
      collection.splice(existingIndex, 1);
    }

    const count = collection.filter((entry) => entry.post_id === postId).length;

    return {
      count,
      active
    };
  });

export const likePost = (postId: number, userId: number) => setReaction('likes', postId, userId, true);
export const unlikePost = (postId: number, userId: number) => setReaction('likes', postId, userId, false);
export const savePost = (postId: number, userId: number) => setReaction('bookmarks', postId, userId, true);
export const unsavePost = (postId: number, userId: number) => setReaction('bookmarks', postId, userId, false);

export const listSavedPosts = (userId: number, limit = 50, cursor?: string): { posts: Post[]; nextCursor: string | null } => {
  const db = readOnlyDatabase();
  // Get all bookmarked post IDs for this user
  const savedPostIds = new Set(
    db.bookmarks
      .filter((bookmark) => bookmark.user_id === userId)
      .map((bookmark) => bookmark.post_id)
  );
  
  if (savedPostIds.size === 0) {
    return { posts: [], nextCursor: null };
  }
  
  // Get all posts that are saved by this user
  let posts = db.posts
    .filter((post) => savedPostIds.has(post.id))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  
  if (cursor) {
    posts = posts.filter((post) => post.created_at < cursor);
  }
  
  const reactionMaps = buildReactionMaps(db, userId);
  const commentCounts = buildCommentCounts(db);
  
  const chunk = posts.slice(0, limit + 1);
  let nextCursor: string | null = null;
  if (chunk.length > limit) {
    const last = chunk.pop()!;
    nextCursor = last.created_at;
  }
  
  const mapped = chunk
    .map((post) => {
      const author = db.users.find((u) => u.id === post.user_id);
      return author ? toPost(post, author, reactionMaps, commentCounts, userId) : null;
    })
    .filter(Boolean) as Post[];
  
  return { posts: mapped, nextCursor };
};

