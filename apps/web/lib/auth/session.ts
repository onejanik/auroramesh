import { parse, serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { IncomingMessage, ServerResponse } from 'http';
import { getUserById } from '../models/users';

const COOKIE_NAME = 'connectsphere_session';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

type TokenPayload = {
  userId: number;
};

const parseCookies = (req: IncomingMessage | NextApiRequest) => {
  if (!req.headers.cookie) return {};
  return parse(req.headers.cookie);
};

export const setSessionCookie = (res: NextApiResponse | ServerResponse, payload: TokenPayload) => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: COOKIE_MAX_AGE });
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  });
  res.setHeader('Set-Cookie', cookie);
};

export const clearSessionCookie = (res: NextApiResponse | ServerResponse) => {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/'
  });
  res.setHeader('Set-Cookie', cookie);
};

export const getUserFromRequest = (req: IncomingMessage | NextApiRequest) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return getUserById(decoded.userId) ?? null;
  } catch (error) {
    return null;
  }
};

