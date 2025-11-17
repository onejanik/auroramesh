import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../lib/auth/requireUser';
import { createReport } from '../../../lib/models/reports';

const schema = z.object({
  targetType: z.enum(['post', 'poll', 'event', 'slideshow', 'audio', 'story']),
  targetId: z.number().int().positive(),
  reason: z.string().min(5).max(500)
});

export default async function reportsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const payload = schema.parse(req.body);
    const report = createReport({
      reporterId: user.id,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Meldung ungültig' });
  }
}

