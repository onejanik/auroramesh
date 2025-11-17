import { useEffect } from 'react';
import useSWR from 'swr';
import { Layout } from '../components/Layout';
import { requirePageAuth } from '../lib/auth/pageAuth';
import { fetcher } from '../lib/fetcher';
import type { Notification } from '../lib/models/notifications';

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

const ActivityPage = () => {
  const { data, mutate } = useSWR<NotificationsResponse>('/api/notifications', fetcher);

  useEffect(() => {
    // Mark all as read when page is viewed
    if (data?.notifications?.length) {
      const unreadIds = data.notifications.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length) {
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: unreadIds })
        }).then(() => mutate());
      }
    }
  }, [data, mutate]);

  const getNotificationText = (notification: Notification): string => {
    switch (notification.type) {
      case 'like':
        return 'hat deinen Beitrag geliked';
      case 'comment':
        return 'hat deinen Beitrag kommentiert';
      case 'follow':
        return 'folgt dir jetzt';
      default:
        return 'hat interagiert';
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.postId) {
      return `/posts/${notification.postId}`;
    }
    if (notification.type === 'follow') {
      return `/users/${notification.actor.id}`;
    }
    return '#';
  };

  return (
    <Layout>
      <h1>Aktivität</h1>
      <p style={{ color: 'var(--muted)' }}>Hier siehst du alle Interaktionen mit deinen Beiträgen.</p>

      {!data && <p style={{ color: 'var(--muted)' }}>Wird geladen...</p>}

      {data && data.notifications.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>Noch keine Aktivitäten vorhanden.</p>
      )}

      {data && data.notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.notifications.map((notification) => (
            <a
              key={notification.id}
              href={getNotificationLink(notification)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: notification.isRead ? 'var(--card-bg)' : 'rgba(108, 92, 231, 0.08)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                textDecoration: 'none',
                color: 'var(--text)',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(108, 92, 231, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = notification.isRead
                  ? 'var(--card-bg)'
                  : 'rgba(108, 92, 231, 0.08)';
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--avatar-bg)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600
                }}
              >
                {notification.actor.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={notification.actor.avatarUrl}
                    alt={notification.actor.name ?? 'Avatar'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  notification.actor.name?.[0]?.toUpperCase() ?? '?'
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0 }}>
                  <strong>{notification.actor.name ?? 'Unbekannt'}</strong> {getNotificationText(notification)}
                </p>
                <small style={{ color: 'var(--muted)' }}>{new Date(notification.createdAt).toLocaleString()}</small>
              </div>
              {!notification.isRead && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    flexShrink: 0
                  }}
                />
              )}
            </a>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default ActivityPage;

export const getServerSideProps = (ctx: any) => requirePageAuth(ctx);

