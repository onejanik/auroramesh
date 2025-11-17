import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { rsvpEvent } from '../../../../lib/models/events';

export default async function rsvpHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  const eventId = Number(req.query.id);
  const { attending } = req.body as { attending?: boolean };
  if (!Number.isFinite(eventId)) {
    res.status(400).json({ message: 'Invalid event id' });
    return;
  }

  try {
    const event = rsvpEvent(eventId, user.id, attending !== false);
    res.status(200).json(event);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'RSVP fehlgeschlagen' });
  }
}

