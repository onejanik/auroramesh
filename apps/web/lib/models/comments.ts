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
  postId: comment.post_id ?? undefined,
  targetType: comment.target_type,
  targetId: comment.target_id ?? undefined,
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
  targetType = 'post',
  targetId,
  postId, // Legacy parameter
  userId,
  content,
  parentCommentId
}: {
  targetType?: 'post' | 'poll' | 'event' | 'slideshow' | 'audio';
  targetId?: number;
  postId?: number; // Legacy parameter
  userId: number;
  content: string;
  parentCommentId?: number;
}): Comment =>
  updateDatabase((db) => {
    const author = db.users.find((user) => user.id === userId);
    if (!author) throw new Error('User not found');
    
    // Determine the actual target (for backward compatibility, postId takes precedence)
    const actualTargetId = postId ?? targetId;
    const actualTargetType = postId ? 'post' : (targetType ?? 'post');
    
    if (!actualTargetId) throw new Error('Target ID required');
    
    // Find the target content
    let targetAuthorId: number | undefined;
    if (actualTargetType === 'post') {
      const post = db.posts.find((entry) => entry.id === actualTargetId);
      if (!post) throw new Error('Post not found');
      targetAuthorId = post.user_id;
    } else if (actualTargetType === 'poll') {
      const poll = db.polls.find((entry) => entry.id === actualTargetId);
      if (!poll) throw new Error('Poll not found');
      targetAuthorId = poll.user_id;
    } else if (actualTargetType === 'event') {
      const event = db.events.find((entry) => entry.id === actualTargetId);
      if (!event) throw new Error('Event not found');
      targetAuthorId = event.user_id;
    } else if (actualTargetType === 'slideshow') {
      const slideshow = db.slideshows.find((entry) => entry.id === actualTargetId);
      if (!slideshow) throw new Error('Slideshow not found');
      targetAuthorId = slideshow.user_id;
    } else if (actualTargetType === 'audio') {
      const audio = db.audios.find((entry) => entry.id === actualTargetId);
      if (!audio) throw new Error('Audio not found');
      targetAuthorId = audio.user_id;
    } else {
      throw new Error('Invalid target type');
    }

    let parent: StoredComment | undefined;
    if (parentCommentId) {
      parent = db.comments.find((entry) => entry.id === parentCommentId);
      if (!parent) throw new Error('Parent comment not found');
    }

    const comment: StoredComment = {
      id: ++db.counters.comments,
      post_id: actualTargetType === 'post' ? actualTargetId : null,
      target_type: actualTargetType,
      target_id: actualTargetId,
      user_id: userId,
      content: content.trim(),
      parent_comment_id: parentCommentId ?? null,
      created_at: new Date().toISOString()
    };
    db.comments.push(comment);
    
    // Create notification for content author (if not the commenter)
    if (targetAuthorId && targetAuthorId !== userId) {
      createNotification({
        userId: targetAuthorId,
        type: 'comment',
        actorId: userId,
        postId: actualTargetType === 'post' ? actualTargetId : undefined,
        commentId: comment.id
      });
    }
    
    // Create notifications for mentioned users
    const mentions = extractMentions(content);
    for (const mention of mentions) {
      const mentionedUser = getUserByName(mention);
      if (mentionedUser && mentionedUser.id !== userId && mentionedUser.id !== targetAuthorId) {
        createNotification({
          userId: mentionedUser.id,
          type: 'comment',
          actorId: userId,
          postId: actualTargetType === 'post' ? actualTargetId : undefined,
          commentId: comment.id
        });
      }
    }

    return toComment(comment, author, 0);
  });

export const listCommentsForPost = (postId: number): Comment[] => {
  const db = readOnlyDatabase();
  const comments = db.comments.filter((comment) => (comment.post_id === postId || (comment.target_type === 'post' && comment.target_id === postId)) && !comment.parent_comment_id);
  return comments
    .map((comment) => {
      const author = db.users.find((user) => user.id === comment.user_id);
      if (!author) return null;
      const repliesCount = db.comments.filter((entry) => entry.parent_comment_id === comment.id).length;
      return toComment(comment, author, repliesCount);
    })
    .filter(Boolean) as Comment[];
};

export const listCommentsForTarget = (targetType: 'post' | 'poll' | 'event' | 'slideshow' | 'audio', targetId: number): Comment[] => {
  const db = readOnlyDatabase();
  const comments = db.comments.filter((comment) => 
    comment.target_type === targetType && 
    comment.target_id === targetId && 
    !comment.parent_comment_id
  );
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
    
    // Check if user is the content author
    let contentAuthorId: number | undefined;
    if (comment.target_type && comment.target_id) {
      if (comment.target_type === 'post') {
        const post = db.posts.find((p) => p.id === comment.target_id);
        contentAuthorId = post?.user_id;
      } else if (comment.target_type === 'poll') {
        const poll = db.polls.find((p) => p.id === comment.target_id);
        contentAuthorId = poll?.user_id;
      } else if (comment.target_type === 'event') {
        const event = db.events.find((e) => e.id === comment.target_id);
        contentAuthorId = event?.user_id;
      } else if (comment.target_type === 'slideshow') {
        const slideshow = db.slideshows.find((s) => s.id === comment.target_id);
        contentAuthorId = slideshow?.user_id;
      } else if (comment.target_type === 'audio') {
        const audio = db.audios.find((a) => a.id === comment.target_id);
        contentAuthorId = audio?.user_id;
      }
    } else if (comment.post_id) {
      // Legacy: check post
      const post = db.posts.find((p) => p.id === comment.post_id);
      contentAuthorId = post?.user_id;
    }
    
    if (contentAuthorId === userId) {
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

