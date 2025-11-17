import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../lib/auth/requireUser';
import { createComment, listCommentsForTarget } from '../../../lib/models/comments';

const schema = z.object({
  targetType: z.enum(['post', 'poll', 'event', 'slideshow', 'audio']),
  targetId: z.number().int().positive(),
  content: z.string().min(1).max(1000),
  parentCommentId: z.number().int().positive().optional()
});

export default async function commentsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const body = schema.parse(req.body);
      const comment = createComment({
        targetType: body.targetType,
        targetId: body.targetId,
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
    const { targetType, targetId, parentId } = req.query;
    
    if (!targetType || !targetId) {
      res.status(400).json({ message: 'targetType and targetId required' });
      return;
    }
    
    if (parentId) {
      const { listReplies } = await import('../../../lib/models/comments');
      const replies = listReplies(Number(parentId));
      res.status(200).json({ comments: replies });
    } else {
      const comments = listCommentsForTarget(
        targetType as 'post' | 'poll' | 'event' | 'slideshow' | 'audio',
        Number(targetId)
      );
      res.status(200).json({ comments });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

