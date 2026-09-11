export function getRequestIp(headers: Pick<Headers, 'get'>): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 5000;

// Lazy pruning keeps the map bounded without a global interval that would
// keep serverless instances warm.
function pruneExpired(): void {
  if (RATE_LIMIT_STORE.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of RATE_LIMIT_STORE) {
    if (now > entry.resetAt) RATE_LIMIT_STORE.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  pruneExpired();
  const now = Date.now();
  let entry = RATE_LIMIT_STORE.get(key);

  if (entry && now > entry.resetAt) {
    RATE_LIMIT_STORE.delete(key);
    entry = undefined;
  }

  if (!entry) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  RATE_LIMIT_STORE.delete(key);
}