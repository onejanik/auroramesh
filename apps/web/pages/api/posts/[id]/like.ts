import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { getPostById, likePost, unlikePost } from '../../../../lib/models/posts';

export default async function likeHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  const postId = Number(req.query.id);
  if (!Number.isFinite(postId)) {
    res.status(400).json({ message: 'Invalid post id' });
    return;
  }

  const exists = getPostById(postId);
  if (!exists) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  if (req.method === 'POST') {
    const result = likePost(postId, user.id);
    res.status(200).json({ likeCount: result.count, liked: result.active });
    return;
  }

  if (req.method === 'DELETE') {
    const result = unlikePost(postId, user.id);
    res.status(200).json({ likeCount: result.count, liked: result.active });
    return;
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}

