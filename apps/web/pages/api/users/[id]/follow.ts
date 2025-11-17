import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { followUser, getUserById, unfollowUser } from '../../../../lib/models/users';

export default async function followHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  const targetId = Number(req.query.id);
  if (!Number.isFinite(targetId)) {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  const target = getUserById(targetId);
  if (!target) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  try {
    if (req.method === 'POST') {
      const result = followUser(user.id, targetId);
      res.status(200).json(result);
      return;
    }
    if (req.method === 'DELETE') {
      const result = unfollowUser(user.id, targetId);
      res.status(200).json(result);
      return;
    }
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Request failed' });
    return;
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}

