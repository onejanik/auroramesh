import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { readOnlyDatabase } from '../../../../lib/db';

export default async function followingHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  const targetId = Number(req.query.id);
  if (Number.isNaN(targetId)) {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  if (req.method === 'GET') {
    const db = readOnlyDatabase();
    const following = db.followers
      .filter((f) => f.follower_id === targetId)
      .map((f) => {
        const followedUser = db.users.find((u) => u.id === f.following_id);
        return followedUser
          ? {
              id: followedUser.id,
              name: followedUser.name,
              avatar_url: followedUser.avatar_url
            }
          : null;
      })
      .filter(Boolean);

    res.status(200).json({ users: following });
    return;
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end('Method Not Allowed');
}

