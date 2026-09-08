import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

const mockCheckRateLimit = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

vi.mock('@/lib/egypt-cities', () => ({
  matchLocation: () => ({ governorate: 'الجيزة', city: 'الجيزة' }),
}));

function makeRequest(search: string): Request {
  return new Request(`https://rentrate.test/api/geocode${search}`);
}

beforeEach(() => {
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
});

describe('GET /api/geocode', () => {
  it('returns 400 when lat is missing', async () => {
    const res = await GET(makeRequest('?lng=31.2'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when lng is missing', async () => {
    const res = await GET(makeRequest('?lat=29.98'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric coordinates', async () => {
    const res = await GET(makeRequest('?lat=abc&lng=31.2'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for out-of-range coordinates', async () => {
    const res = await GET(makeRequest('?lat=95&lng=31.2'));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 5000 });
    const res = await GET(makeRequest('?lat=29.98&lng=31.2'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('reverse-geocodes valid coordinates', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          address: {
            suburb: 'الشيخ زايد',
            city: 'مدينة السادس من أكتوبر',
            state: 'الجيزة',
          },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeRequest('?lat=29.98&lng=31.2'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.governorate).toBe('الجيزة');
    expect(body.city).toBe('الجيزة');
    expect(body.area).toBe('الشيخ زايد');

    vi.unstubAllGlobals();
  });
});