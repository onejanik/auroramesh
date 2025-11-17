import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../lib/auth/requireUser';
import { listSavedPosts } from '../../../lib/models/posts';

export default async function savedPostsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { limit, cursor } = req.query;
    const parsedLimit = limit ? Math.min(Number(limit), 50) : 50;
    const cursorValue = typeof cursor === 'string' && cursor !== 'undefined' ? cursor : undefined;
    
    const result = listSavedPosts(user.id, parsedLimit, cursorValue);
    res.status(200).json(result);
    return;
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end('Method Not Allowed');
}

