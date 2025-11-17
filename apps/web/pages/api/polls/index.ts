import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../lib/auth/requireUser';
import { createPoll, listPolls } from '../../../lib/models/polls';

const schema = z.object({
  question: z.string().min(5).max(280),
  options: z.array(z.string().min(1)).min(2).max(6)
});

export default async function pollsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const payload = schema.parse(req.body);
      const poll = createPoll({ userId: user.id, question: payload.question, options: payload.options });
      res.status(201).json(poll);
      return;
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Ungültige Umfrage' });
      return;
    }
  }

  if (req.method === 'GET') {
    const excludeUserId = req.query.excludeUserId ? parseInt(req.query.excludeUserId as string, 10) : undefined;
    const polls = listPolls(user.id, excludeUserId);
    res.status(200).json({ polls });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

