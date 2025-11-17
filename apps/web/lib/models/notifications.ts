import { readOnlyDatabase, updateDatabase, type StoredNotification } from '../db';

export type Notification = {
  id: number;
  type: 'like' | 'comment' | 'follow';
  actor: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
  postId?: number;
  commentId?: number;
  isRead: boolean;
  createdAt: string;
};

const toNotification = (
  notification: StoredNotification,
  actor: { id: number; name: string | null; avatar_url: string | null }
): Notification => ({
  id: notification.id,
  type: notification.type,
  actor: {
    id: actor.id,
    name: actor.name,
    avatarUrl: actor.avatar_url
  },
  postId: notification.post_id,
  commentId: notification.comment_id,
  isRead: notification.is_read,
  createdAt: notification.created_at
});

export const createNotification = ({
  userId,
  type,
  actorId,
  postId,
  commentId
}: {
  userId: number;
  type: 'like' | 'comment' | 'follow';
  actorId: number;
  postId?: number;
  commentId?: number;
}): void => {
  // Don't create notification if actor is the same as the user
  if (userId === actorId) return;
  
  updateDatabase((db) => {
    const notification: StoredNotification = {
      id: ++db.counters.notifications,
      user_id: userId,
      type,
      actor_id: actorId,
      post_id: postId,
      comment_id: commentId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    db.notifications.push(notification);
  });
};

export const listNotifications = (userId: number, limit = 50): Notification[] => {
  const db = readOnlyDatabase();
  return db.notifications
    .filter((n) => n.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit)
    .map((notification) => {
      const actor = db.users.find((u) => u.id === notification.actor_id);
      if (!actor) return null;
      return toNotification(notification, actor);
    })
    .filter(Boolean) as Notification[];
};

export const markNotificationsAsRead = (userId: number, notificationIds?: number[]): void => {
  updateDatabase((db) => {
    db.notifications.forEach((notification) => {
      if (notification.user_id === userId) {
        if (!notificationIds || notificationIds.includes(notification.id)) {
          notification.is_read = true;
        }
      }
    });
  });
};

export const getUnreadCount = (userId: number): number => {
  const db = readOnlyDatabase();
  return db.notifications.filter((n) => n.user_id === userId && !n.is_read).length;
};

