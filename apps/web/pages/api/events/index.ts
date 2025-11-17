import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../lib/auth/requireUser';
import { createEvent, listEvents } from '../../../lib/models/events';

const schema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000),
  location: z.string().max(160),
  startsAt: z.string()
});

export default async function eventsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const payload = schema.parse(req.body);
      const event = createEvent({ 
        userId: user.id, 
        title: payload.title,
        description: payload.description,
        location: payload.location,
        startsAt: payload.startsAt
      });
      res.status(201).json(event);
      return;
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Event ungültig' });
      return;
    }
  }

  if (req.method === 'GET') {
    const excludeUserId = req.query.excludeUserId ? Number(req.query.excludeUserId) : undefined;
    const events = listEvents(user.id, excludeUserId);
    res.status(200).json({ events });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

