import { readOnlyDatabase, updateDatabase, type StoredComment } from '../db';
import type { Comment } from '../../types/comment';
import { createNotification } from './notifications';
import { extractMentions } from '../utils/mentions';
import { getUserByName } from './users';

const toComment = (
  comment: StoredComment,
  author: { id: number; name: string | null; avatar_url: string | null },
  repliesCount: number
): Comment => ({
  id: comment.id,
  postId: comment.post_id,
  parentCommentId: comment.parent_comment_id ?? null,
  content: comment.content,
  createdAt: comment.created_at,
  author: {
    id: author.id,
    name: author.name,
    avatarUrl: author.avatar_url
  },
  repliesCount
});

export const createComment = ({
  postId,
  userId,
  content,
  parentCommentId
}: {
  postId: number;
  userId: number;
  content: string;
  parentCommentId?: number;
}): Comment =>
  updateDatabase((db) => {
    const author = db.users.find((user) => user.id === userId);
    if (!author) throw new Error('User not found');
    const post = db.posts.find((entry) => entry.id === postId);
    if (!post) throw new Error('Post not found');

    let parent: StoredComment | undefined;
    if (parentCommentId) {
      parent = db.comments.find((entry) => entry.id === parentCommentId);
      if (!parent) throw new Error('Parent comment not found');
    }

    const comment: StoredComment = {
      id: ++db.counters.comments,
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_comment_id: parentCommentId ?? null,
      created_at: new Date().toISOString()
    };
    db.comments.push(comment);
    
    // Create notification for post author (if not the commenter)
    if (post.user_id !== userId) {
      createNotification({
        userId: post.user_id,
        type: 'comment',
        actorId: userId,
        postId,
        commentId: comment.id
      });
    }
    
    // Create notifications for mentioned users
    const mentions = extractMentions(content);
    for (const mention of mentions) {
      const mentionedUser = getUserByName(mention);
      if (mentionedUser && mentionedUser.id !== userId && mentionedUser.id !== post.user_id) {
        createNotification({
          userId: mentionedUser.id,
          type: 'comment',
          actorId: userId,
          postId,
          commentId: comment.id
        });
      }
    }

    return toComment(comment, author, 0);
  });

export const listCommentsForPost = (postId: number): Comment[] => {
  const db = readOnlyDatabase();
  const comments = db.comments.filter((comment) => comment.post_id === postId && !comment.parent_comment_id);
  return comments
    .map((comment) => {
      const author = db.users.find((user) => user.id === comment.user_id);
      if (!author) return null;
      const repliesCount = db.comments.filter((entry) => entry.parent_comment_id === comment.id).length;
      return toComment(comment, author, repliesCount);
    })
    .filter(Boolean) as Comment[];
};

export const listReplies = (commentId: number): Comment[] => {
  const db = readOnlyDatabase();
  return db.comments
    .filter((comment) => comment.parent_comment_id === commentId)
    .map((comment) => {
      const author = db.users.find((user) => user.id === comment.user_id);
      if (!author) return null;
      const repliesCount = db.comments.filter((entry) => entry.parent_comment_id === comment.id).length;
      return toComment(comment, author, repliesCount);
    })
    .filter(Boolean) as Comment[];
};

export const deleteComment = (commentId: number, userId: number): { success: boolean } =>
  updateDatabase((db) => {
    const comment = db.comments.find((c) => c.id === commentId);
    if (!comment) return { success: false };
    
    // Check if user is the comment author
    if (comment.user_id === userId) {
      const index = db.comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        db.comments.splice(index, 1);
        // Also delete all replies
        db.comments = db.comments.filter((c) => c.parent_comment_id !== commentId);
      }
      return { success: true };
    }
    
    // Check if user is the post author
    const post = db.posts.find((p) => p.id === comment.post_id);
    if (post && post.user_id === userId) {
      const index = db.comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        db.comments.splice(index, 1);
        // Also delete all replies
        db.comments = db.comments.filter((c) => c.parent_comment_id !== commentId);
      }
      return { success: true };
    }
    
    return { success: false };
  });

