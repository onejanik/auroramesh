import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../lib/auth/requireUser';
import { createStory, listActiveStories } from '../../../lib/models/stories';

const schema = z.object({
  mediaUrl: z.string().min(1),
  mediaType: z.enum(['image', 'video']),
  caption: z.string().max(2200).optional(),
  durationSeconds: z.number().min(0).max(60).optional()
});

export default async function storiesHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const payload = schema.parse(req.body);
      const story = createStory({
        userId: user.id,
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType,
        caption: payload.caption,
        durationSeconds: payload.durationSeconds
      });
      res.status(201).json(story);
      return;
    } catch (error) {
      console.error('Story creation failed', error);
      res.status(400).json({ message: 'Invalid story payload' });
      return;
    }
  }

  if (req.method === 'GET') {
    const stories = listActiveStories();
    res.status(200).json({ stories });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

