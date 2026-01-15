import { Context, Next } from 'hono';
import type { Env } from '../types/whatsapp';

// API Key authentication middleware
// Protects your public API endpoints from unauthorized access
export async function apiKeyAuth(c: Context<{ Bindings: Env }>, next: Next) {
  // Skip auth if API_KEY is not configured
  if (!c.env.API_KEY) {
    return next();
  }

  // Check for API key in header
  const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'API key is required. Provide it via X-API-Key header or Authorization: Bearer <key>',
      },
      401
    );
  }

  // Validate API key using timing-safe comparison
  if (!timingSafeEqual(apiKey, c.env.API_KEY)) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key',
      },
      401
    );
  }

  return next();
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

// Rate limiting middleware (simple in-memory implementation)
// For production, consider using Cloudflare's built-in rate limiting or D1/KV
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
} = {}) {
  const windowMs = options.windowMs || 60000; // Default: 1 minute
  const maxRequests = options.maxRequests || 100; // Default: 100 requests per minute

  return async (c: Context, next: Next) => {
    // Get client identifier (IP or API key)
    const clientId =
      c.req.header('X-API-Key') ||
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0] ||
      'unknown';

    const now = Date.now();
    const clientData = requestCounts.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      // New window
      requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
    } else if (clientData.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      c.header('Retry-After', retryAfter.toString());
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', clientData.resetTime.toString());

      return c.json(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        429
      );
    } else {
      // Increment count
      clientData.count++;
    }

    // Add rate limit headers
    const currentData = requestCounts.get(clientId)!;
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - currentData.count).toString());
    c.header('X-RateLimit-Reset', currentData.resetTime.toString());

    return next();
  };
}

// Request logging middleware
export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  // Add request ID to context
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);

  console.log(`[${requestId}] ${c.req.method} ${c.req.path} - Started`);

  await next();

  const duration = Date.now() - start;
  console.log(`[${requestId}] ${c.req.method} ${c.req.path} - ${c.res.status} (${duration}ms)`);
}

// CORS middleware configuration
export const corsConfig = {
  origin: '*', // Configure this for production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposeHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
};
