import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getUserWithPasswordByEmail } from '../../../lib/models/users';
import { setSessionCookie } from '../../../lib/auth/session';
import { checkRateLimit, rateLimitConfigs } from '../../../lib/rateLimit';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export default async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  // Rate limiting
  if (checkRateLimit(req, res, rateLimitConfigs.auth)) {
    return;
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const user = getUserWithPasswordByEmail(normalizedEmail);
  if (!user) {
    res.status(401).json({ message: 'Ungültige Zugangsdaten' });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!valid) {
    res.status(401).json({ message: 'Ungültige Zugangsdaten' });
    return;
  }

  setSessionCookie(res, { userId: user.id });
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio ?? ''
    }
  });
}

