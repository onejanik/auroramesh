import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../lib/auth/requireUser';
import { listNotifications, markNotificationsAsRead, getUnreadCount } from '../../lib/models/notifications';

export default async function notificationsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50;
    const notifications = listNotifications(user.id, limit);
    const unreadCount = getUnreadCount(user.id);
    res.status(200).json({ notifications, unreadCount });
    return;
  }

  if (req.method === 'PATCH') {
    const { notificationIds } = req.body;
    markNotificationsAsRead(user.id, notificationIds);
    res.status(200).json({ success: true });
    return;
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end('Method Not Allowed');
}

