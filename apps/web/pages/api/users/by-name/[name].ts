import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../lib/auth/requireUser';
import { getUserByName } from '../../../../lib/models/users';

export default async function userByNameHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  const name = req.query.name as string;
  if (!name) {
    res.status(400).json({ message: 'Name required' });
    return;
  }

  const foundUser = getUserByName(name);
  if (!foundUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({ id: foundUser.id, name: foundUser.name });
}

