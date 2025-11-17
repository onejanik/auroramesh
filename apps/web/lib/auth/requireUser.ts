import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from './session';
import type { UserRecord } from '../models/users';

export const requireUser = (req: NextApiRequest, res: NextApiResponse): UserRecord | null => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  return user;
};

