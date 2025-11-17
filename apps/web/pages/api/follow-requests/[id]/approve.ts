import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { approveFollowRequest } from '../../../../lib/models/users';

export default async function approveRequestHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  const followerId = Number(req.query.id);
  if (!Number.isFinite(followerId)) {
    res.status(400).json({ message: 'Invalid user ID' });
    return;
  }

  const result = approveFollowRequest(user.id, followerId);
  if (result.success) {
    res.status(200).json({ message: 'Follow request approved' });
  } else {
    res.status(404).json({ message: 'Follow request not found' });
  }
}

