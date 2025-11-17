import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../lib/auth/requireUser';
import { deleteComment } from '../../../lib/models/comments';

export default async function commentHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  const commentId = Number(req.query.id);
  if (Number.isNaN(commentId)) {
    res.status(400).json({ message: 'Invalid comment id' });
    return;
  }

  if (req.method === 'DELETE') {
    const result = deleteComment(commentId, user.id);
    if (!result.success) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end('Method Not Allowed');
}

