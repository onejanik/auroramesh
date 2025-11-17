import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../lib/auth/requireUser';
import { readOnlyDatabase } from '../../../lib/db';

type TagResult = {
  tag: string;
  postCount: number;
};

export default async function tagSearchHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { q = '', limit } = req.query;
  const query = typeof q === 'string' ? q.trim().toLowerCase() : '';
  const parsedLimit = limit ? Math.min(Number(limit), 25) : 20;

  if (!query) {
    res.status(200).json({ results: [] });
    return;
  }

  const db = readOnlyDatabase();
  
  // Collect all tags from all posts
  const tagCounts = new Map<string, number>();
  
  db.posts.forEach((post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase();
        if (normalizedTag.includes(query)) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    }
  });

  // Convert to array and sort by post count
  const results: TagResult[] = Array.from(tagCounts.entries())
    .map(([tag, postCount]) => ({ tag, postCount }))
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, parsedLimit);

  res.status(200).json({ results });
}

