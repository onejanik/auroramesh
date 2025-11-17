import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../lib/auth/requireUser';
import { getUserStats, searchUsers, canViewPrivateAccount } from '../../../lib/models/users';

export default async function searchHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { q = '', limit } = req.query;
  const query = typeof q === 'string' ? q : '';
  const parsedLimit = limit ? Math.min(Number(limit), 25) : 20;

  if (!query.trim()) {
    res.status(200).json({ results: [] });
    return;
  }

  const matches = searchUsers(query, parsedLimit).map((match) => {
    const canView = canViewPrivateAccount(user.id, match.id);
    const stats = getUserStats(match.id);
    
    // If account is private and viewer can't see content, hide detailed stats
    if (match.is_private && !canView) {
      return {
        id: match.id,
        name: match.name,
        avatar_url: match.avatar_url,
        bio: null, // Hide bio for private accounts
        is_private: match.is_private,
        stats: {
          followerCount: stats.followerCount,
          // Hide post and like counts for private accounts
          postCount: 0,
          totalLikes: 0
        }
      };
    }
    
    return {
      ...match,
      stats
    };
  });

  res.status(200).json({ results: matches });
}

