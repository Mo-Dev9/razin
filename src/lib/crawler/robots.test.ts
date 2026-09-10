import { describe, it, expect } from 'vitest';
import { parseRobotsTxt, robotsAllows, patternMatchesPath, selectRules } from '@/lib/crawler/robots';

describe('patternMatchesPath', () => {
  it('matches simple prefix', () => {
    expect(patternMatchesPath('/en/properties/', '/en/properties/apartments')).toBe(true);
    expect(patternMatchesPath('/en/properties/', '/en/cars')).toBe(false);
  });

  it('supports * wildcard anywhere', () => {
    // صارم حسب RFC 9309: النمط "/en/properties/*" = بادئة حرفية + '*' يطابق صفرًا أو أكثر.
    expect(patternMatchesPath('/en/properties/*', '/en/properties/')).toBe(true);
    expect(patternMatchesPath('/en/properties/*', '/en/properties/apartments/x')).toBe(true);
    expect(patternMatchesPath('/en/properties/*', '/en/properties')).toBe(false); // تنقص الشرطة الحرفية
    // الـ runner يمرر pathname فقط (بلا query) — النمط الذي يحتوي '?' لا يطابق pathnameً.
    expect(patternMatchesPath('/*?sort=1', '/en/properties')).toBe(false);
    expect(patternMatchesPath('*search', '/en/xsearch')).toBe(true);
  });
});

describe('parseRobotsTxt + robotsAllows', () => {
  const DEFAULT_GROUP = `
User-agent: *
Disallow: /en/properties/
Allow: /en/properties/public/
Crawl-delay: 2
Sitemap: https://www.olx.com.eg/sitemap.xml
`;

  it('parses group, delay, sitemap', () => {
    const rules = parseRobotsTxt(DEFAULT_GROUP, 'razinbot');
    expect(rules.disallow).toEqual(['/en/properties/']);
    expect(rules.allow).toEqual(['/en/properties/public/']);
    expect(rules.crawlDelayMs).toBe(2000);
    expect(rules.sitemaps).toContain('https://www.olx.com.eg/sitemap.xml');
  });

  it('allows by default when no rule matches', () => {
    const rules = parseRobotsTxt(DEFAULT_GROUP, 'razinbot');
    expect(robotsAllows(rules, '/en/cars')).toBe(true);
    expect(robotsAllows(rules, '/robots.txt')).toBe(true);
  });

  it('disallows the matched prefix and longest rule wins', () => {
    const rules = parseRobotsTxt(DEFAULT_GROUP, 'razinbot');
    expect(robotsAllows(rules, '/en/properties/apartments')).toBe(false);
    expect(robotsAllows(rules, '/en/properties/public/x')).toBe(true); // Allow أطول
  });

  it('prefers our specific group over the generic group', () => {
    const body = `
User-agent: *
Disallow: /
User-agent: RazinBot
Disallow: /private/
`;
    const rules = parseRobotsTxt(body, 'razinbot');
    expect(robotsAllows(rules, '/anything')).toBe(true);
    expect(robotsAllows(rules, '/private/page')).toBe(false);
  });

  it('treats empty/comment-only files as fully allowed', () => {
    expect(robotsAllows(parseRobotsTxt('# nothing here', 'razinbot'), '/any')).toBe(true);
    expect(robotsAllows(parseRobotsTxt('', 'razinbot'), '/any')).toBe(true);
  });

  it('empty file yields empty rules', () => {
    const rules = parseRobotsTxt('', 'razinbot');
    expect(rules.allow).toEqual([]);
    expect(rules.disallow).toEqual([]);
    expect(rules.crawlDelayMs).toBeNull();
  });
});

describe('selectRules', () => {
  it('ranks specific groups higher than generic', () => {
    const blocks = [
      { agent: ['*'], allow: ['/'], disallow: ['/x'], crawlDelayMs: null },
      { agent: ['razinbot'], allow: ['/y'], disallow: [], crawlDelayMs: 1000 },
    ];
    const s = selectRules(blocks, 'razinbot');
    expect(s.disallow).toEqual([]);
    expect(s.crawlDelayMs).toBe(1000);
  });

  it('merges same-rank groups', () => {
    const blocks = [
      { agent: ['*'], allow: ['/a'], disallow: [], crawlDelayMs: null },
      { agent: ['*'], allow: ['/b'], disallow: [], crawlDelayMs: null },
    ];
    const s = selectRules(blocks, 'x');
    expect(s.allow).toContain('/a');
    expect(s.allow).toContain('/b');
  });
});