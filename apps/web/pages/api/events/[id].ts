import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../lib/auth/requireUser';
import { deleteEvent, getEventById } from '../../../lib/models/events';
import { isAdminUser } from '../../../lib/auth/isAdmin';
import { getUserById } from '../../../lib/models/users';

export default async function eventHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  
  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    res.status(400).send('Invalid id');
    return;
  }

  if (req.method === 'GET') {
    const event = getEventById(id, user.id);
    if (!event) {
      res.status(404).end();
      return;
    }
    res.status(200).json(event);
    return;
  }

  if (req.method === 'DELETE') {
    const event = getEventById(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    const userRecord = getUserById(user.id);
    const isAdmin = userRecord ? isAdminUser(userRecord) : false;
    const isOwner = event.author.id === user.id;
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    
    const result = deleteEvent(id, event.author.id);
    if (!result.changes) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}

