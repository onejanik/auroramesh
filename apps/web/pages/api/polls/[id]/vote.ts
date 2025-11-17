import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { votePoll } from '../../../../lib/models/polls';

export default async function voteHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  const pollId = Number(req.query.id);
  const { optionId } = req.body as { optionId?: string };
  if (!Number.isFinite(pollId) || !optionId) {
    res.status(400).json({ message: 'Ungültige Auswahl' });
    return;
  }

  try {
    const poll = votePoll(pollId, optionId, user.id);
    res.status(200).json(poll);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Abstimmung fehlgeschlagen' });
  }
}

