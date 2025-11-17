import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/auth/session';

export default function meHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: 'Unauthenticated' });
    return;
  }
  res.status(200).json({ user });
}

