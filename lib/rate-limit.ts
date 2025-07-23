import { NextApiRequest, NextApiResponse } from 'next';

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
  statusCode?: number;
}

export const createRateLimiter = (config: RateLimitConfig) => {
  return (req: NextApiRequest, res: NextApiResponse) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const key = `${ip}-${req.url}`;
    const now = Date.now();
    
    // Get current rate limit data
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true; // Allow request
    }
    
    if (current.count >= config.max) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', config.max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
      
      res.status(config.statusCode || 429).json({
        success: false,
        error: config.message || 'Too many requests',
        retryAfter,
        timestamp: new Date()
      });
      
      return false; // Block request
    }
    
    // Increment count
    current.count++;
    rateLimitStore.set(key, current);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max.toString());
    res.setHeader('X-RateLimit-Remaining', (config.max - current.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
    
    return true; // Allow request
  };
};

// Predefined rate limiters
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP',
  statusCode: 429
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 authentication attempts per 15 minutes
  message: 'Too many authentication attempts',
  statusCode: 429
});

export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 chat messages per minute
  message: 'Too many chat messages',
  statusCode: 429
});

export const trainingLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 training entries per minute
  message: 'Too many training entries',
  statusCode: 429
});

// Higher-order function to wrap API handlers with rate limiting
export const withRateLimit = (
  rateLimiter: (req: NextApiRequest, res: NextApiResponse) => boolean,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowed = rateLimiter(req, res);
    if (!allowed) {
      return; // Response already sent by rate limiter
    }
    return handler(req, res);
  };
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, data]) => {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}, 60 * 1000); // Clean up every minute 