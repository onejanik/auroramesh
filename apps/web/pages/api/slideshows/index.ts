import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../lib/auth/requireUser';
import { createSlideshow, listSlideshows } from '../../../lib/models/slideshows';

const schema = z.object({
  mediaUrls: z.array(z.string().min(1)).min(1).max(10),
  caption: z.string().max(2200).optional()
});

export default async function slideshowsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const payload = schema.parse(req.body);
      const slideshow = createSlideshow({ userId: user.id, mediaUrls: payload.mediaUrls, caption: payload.caption });
      res.status(201).json(slideshow);
      return;
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Slideshow ungültig' });
      return;
    }
  }

  if (req.method === 'GET') {
    const excludeUserId = req.query.excludeUserId ? Number(req.query.excludeUserId) : undefined;
    const slideshows = listSlideshows(user.id, excludeUserId);
    res.status(200).json({ slideshows });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

