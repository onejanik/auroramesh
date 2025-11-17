import type { NextApiRequest, NextApiResponse } from 'next';

type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const store: RateLimitStore = new Map();

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 60 * 60 * 1000);

export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
};

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
};

/**
 * Rate limiter middleware
 * Returns true if request should be blocked
 */
export function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig = defaultConfig
): boolean {
  // Get identifier (IP or user ID)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';
  const identifier = `${ip}:${req.url}`;

  const now = Date.now();
  const record = store.get(identifier);

  if (!record || record.resetTime < now) {
    // New window
    store.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return false;
  }

  if (record.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter
    });
    return true;
  }

  // Increment counter
  record.count += 1;
  return false;
}

/**
 * Specific rate limit configs for different endpoints
 */
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // Only 5 login/register attempts
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20 // 20 uploads per hour
  },
  post: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50 // 50 posts per hour
  },
  comment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100 // 100 comments per hour
  },
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per 15 minutes
  }
};

