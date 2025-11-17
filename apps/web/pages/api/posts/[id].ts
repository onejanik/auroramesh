import type { NextApiRequest, NextApiResponse } from 'next';
import { deletePost, getPostById, updatePostPrivacy } from '../../../lib/models/posts';
import { requireUser } from '../../../lib/auth/requireUser';
import { isAdminUser } from '../../../lib/auth/isAdmin';
import { getUserById } from '../../../lib/models/users';

export default async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  const id = Number(req.query.id);

  if (Number.isNaN(id)) {
    res.status(400).send('Invalid id');
    return;
  }

  if (req.method === 'GET') {
    const post = getPostById(id, user.id);
    if (!post) {
      res.status(404).end();
      return;
    }
    res.status(200).json(post);
    return;
  }

  if (req.method === 'PATCH') {
    const { isPrivate } = req.body;
    if (typeof isPrivate !== 'boolean') {
      res.status(400).json({ message: 'Invalid isPrivate value' });
      return;
    }
    const result = updatePostPrivacy(id, user.id, isPrivate);
    if (!result.success) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    res.status(200).json({ isPrivate: result.isPrivate });
    return;
  }

  if (req.method === 'DELETE') {
    const post = getPostById(id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    const userRecord = getUserById(user.id);
    const isAdmin = userRecord ? isAdminUser(userRecord) : false;
    const isOwner = post.author.id === user.id;
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    
    const result = deletePost(id, post.author.id);
    if (!result.changes) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}

