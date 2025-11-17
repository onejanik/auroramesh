import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getUserById, updateUserProfile } from '../../lib/models/users';
import { requireUser } from '../../lib/auth/requireUser';

const schema = z.object({
  name: z.string().max(80).optional(),
  bio: z.string().max(280).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  favoriteTags: z.array(z.string().min(1)).max(20).optional(),
  avatarUrl: z.string().max(500).optional().nullable(),
  isPrivate: z.boolean().optional()
});

export default async function profileHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const profile = getUserById(user.id);
    res.status(200).json(profile);
    return;
  }

  if (req.method === 'PUT') {
    const parsed = schema.parse(req.body);
    const updated = updateUserProfile(user.id, parsed);
    res.status(200).json(updated);
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end('Method Not Allowed');
}

