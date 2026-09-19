import { FastifyRequest, FastifyReply } from 'fastify';

// Allowed origins for CORS whitelist
const DEFAULT_ALLOWED_ORIGINS = [
  'https://carpels.orangyy.design',
  'https://fortest.orangyy.design',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
];

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true; // Allow non-browser requests (e.g. curl / server-to-server / health checks)
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);

  const allowed = [...DEFAULT_ALLOWED_ORIGINS, ...envOrigins].map((o) => o.toLowerCase());
  const originLower = origin.toLowerCase().trim();

  return allowed.some((allowedOrigin) => {
    if (originLower === allowedOrigin) return true;
    // Strip trailing slash if present
    if (originLower.replace(/\/$/, '') === allowedOrigin.replace(/\/$/, '')) return true;
    return false;
  });
}

// Security Headers Hook
export function applySecurityHeaders(request: FastifyRequest, reply: FastifyReply) {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'SAMEORIGIN');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.removeHeader('X-Powered-By');
}

// In-Memory Sliding Window Rate Limiter for Login Attempts
interface RateLimitRecord {
  count: number;
  firstAttempt: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
  }

  // If window expired, reset record
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - record.count };
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}
