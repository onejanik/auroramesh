import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createUser, getUserWithPasswordByEmail, getUserByName, generateUsernameVariations } from '../../../lib/models/users';
import { setSessionCookie } from '../../../lib/auth/session';
import { checkRateLimit, rateLimitConfigs } from '../../../lib/rateLimit';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(60)
});

export default async function registerHandler(req: NextApiRequest, res: NextApiResponse) {
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
    res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
    return;
  }

  const existing = getUserWithPasswordByEmail(parsed.data.email);
  if (existing) {
    res.status(409).json({ message: 'E-Mail bereits registriert' });
    return;
  }

  // Check if username already exists
  const existingName = getUserByName(parsed.data.name);
  if (existingName) {
    const suggestions = generateUsernameVariations(parsed.data.name);
    res.status(409).json({ 
      message: 'Nutzername bereits vergeben',
      suggestions 
    });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = createUser({
    email: parsed.data.email.toLowerCase(),
    name: parsed.data.name,
    passwordHash
  });

  setSessionCookie(res, { userId: user.id });
  res.status(201).json({ user });
}

