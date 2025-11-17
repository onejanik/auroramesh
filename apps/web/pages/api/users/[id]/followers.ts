import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { readOnlyDatabase } from '../../../../lib/db';

export default async function followersHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  const targetId = Number(req.query.id);
  if (Number.isNaN(targetId)) {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  if (req.method === 'GET') {
    const db = readOnlyDatabase();
    const followers = db.followers
      .filter((f) => f.following_id === targetId)
      .map((f) => {
        const follower = db.users.find((u) => u.id === f.follower_id);
        return follower
          ? {
              id: follower.id,
              name: follower.name,
              avatar_url: follower.avatar_url
            }
          : null;
      })
      .filter(Boolean);

    res.status(200).json({ users: followers });
    return;
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end('Method Not Allowed');
}

