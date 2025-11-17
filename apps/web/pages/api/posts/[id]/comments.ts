import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../../lib/auth/requireUser';
import { createComment, listCommentsForPost, listReplies } from '../../../../lib/models/comments';

const schema = z.object({
  content: z.string().min(1).max(1000),
  parentCommentId: z.number().int().positive().optional()
});

export default async function commentsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  const postId = Number(req.query.id);
  if (!Number.isFinite(postId)) {
    res.status(400).json({ message: 'Ungültige Post-ID' });
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = schema.parse(req.body);
      const comment = createComment({
        postId,
        userId: user.id,
        content: body.content,
        parentCommentId: body.parentCommentId
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Kommentar ungültig' });
    }
    return;
  }

  if (req.method === 'GET') {
    const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;
    if (parentId) {
      const replies = listReplies(parentId);
      res.status(200).json({ comments: replies });
    } else {
      const comments = listCommentsForPost(postId);
      res.status(200).json({ comments });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

