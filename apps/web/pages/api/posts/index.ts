import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createPost, listPosts } from '../../../lib/models/posts';
import { requireUser } from '../../../lib/auth/requireUser';

const createSchema = z.object({
  mediaUrl: z.string().min(1),
  mediaType: z.enum(['image', 'video']),
  caption: z.string().max(2200).optional(),
  tags: z.array(z.string().min(1)).max(10).optional()
});

export default async function postsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const body = createSchema.parse(req.body);
      const post = createPost({
        userId: user.id,
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType,
        caption: body.caption,
        tags: body.tags ?? []
      });
      res.status(201).json(post);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Post creation failed:', message);
      res.status(400).json({ message: 'Invalid request' });
      return;
    }
  }

  if (req.method === 'GET') {
    const { limit, cursor, excludeUserId, userId } = req.query;
    const parsedLimit = limit ? Math.min(Number(limit), 50) : 20;
    const cursorValue = typeof cursor === 'string' && cursor !== 'undefined' ? cursor : undefined;
    const excludeId =
      typeof excludeUserId === 'string' && excludeUserId.trim().length ? Number(excludeUserId) : undefined;
    const onlyUserId = typeof userId === 'string' && userId.trim().length ? Number(userId) : undefined;

    const feed = listPosts(parsedLimit, cursorValue, {
      excludeUserId: Number.isFinite(excludeId) ? excludeId : undefined,
      userId: Number.isFinite(onlyUserId) ? onlyUserId : undefined,
      viewerId: user.id,
      preferredTags: user.favorite_tags?.length ? user.favorite_tags : undefined
    });
    res.status(200).json(feed);
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

