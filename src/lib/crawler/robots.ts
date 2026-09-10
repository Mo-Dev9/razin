/**
 * محلّل robots.txt مبسّط بكافّة القواعد العملية المطلوبة للكراولر الأدبي:
 * مجموعات User-agent، Allow/Disallow مع البدل «*»، وأولوية أطول تطابق قبل وبعد الفرز.
 * لا ننفّذ هنا إلا مجموعة الـ user-agent الخاص بنا (مع احترام المجموعة العامة «*»).
 */

export interface RobotsRules {
  /** قواعد Allow: بداية المسار (تُطابق مع بدل «*») ثم شروع فعلي. */
  allow: string[];
  disallow: string[];
  crawlDelayMs: number | null;
  sitemaps: string[];
}

const UA_GROUP_RE = /^user-agent\s*:\s*(.+)$/i;
const ALLOW_RE = /^allow\s*:\s*(.*)$/i;
const DISALLOW_RE = /^disallow\s*:\s*(.*)$/i;
const DELAY_RE = /^crawl-delay\s*:\s*([\d.]+)\s*$/i;
const SITEMAP_RE = /^sitemap\s*:\s*(.+)$/i;
const COMMENT_OR_BLANK = /^\s*(#.*)?$/;

/** هل السطر يبدأ توجيهًا لمجموعة agent؟ */
function isDirective(line: string): boolean {
  return (
    UA_GROUP_RE.test(line) ||
    ALLOW_RE.test(line) ||
    DISALLOW_RE.test(line) ||
    DELAY_RE.test(line) ||
    SITEMAP_RE.test(line)
  );
}

/** مطابقة بادئة مع دعم البدل «*» (صفر أو أكثر من أي حرف). */
export function patternMatchesPath(pattern: string, path: string): boolean {
  const p = pattern.trim();
  if (!p) return false;
  const pieces = p.split('*');
  if (pieces.length === 1) return path.startsWith(pieces[0] as string);
  let rest: string = path;
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    if (piece === '') continue;
    const idx = rest.indexOf(piece);
    if (idx === -1) return false;
    if (i === 0 && !rest.startsWith(piece)) return false;
    rest = rest.slice(idx + piece.length);
  }
  return true;
}

export function selectRules(blocks: { agent: string[]; allow: string[]; disallow: string[]; crawlDelayMs: number | null }[], userAgentToken: string): {
  allow: string[];
  disallow: string[];
  crawlDelayMs: number | null;
} {
  // أدق تطابق أولًا (خاص + عام)، مع احترام ترتيب الملف عند تساوي الدقة.
  const rank = (agents: string[]): number => {
    if (agents.some((a) => a.toLowerCase() === userAgentToken.toLowerCase())) return 2;
    if (agents.some((a) => a === '*')) return 1;
    return 0;
  };
  let bestRank = 0;
  let allow: string[] = [];
  let disallow: string[] = [];
  let crawlDelayMs: number | null = null;
  for (const b of blocks) {
    const r = rank(b.agent);
    if (r > bestRank) {
      bestRank = r;
      allow = b.allow;
      disallow = b.disallow;
      crawlDelayMs = b.crawlDelayMs;
    } else if (r === bestRank && r > 0) {
      allow = [...allow, ...b.allow];
      disallow = [...disallow, ...b.disallow];
      if (crawlDelayMs === null) crawlDelayMs = b.crawlDelayMs;
    }
  }
  return { allow, disallow, crawlDelayMs };
}

export function parseRobotsTxt(body: string, userAgentToken: string): RobotsRules {
  const blocks: { agent: string[]; allow: string[]; disallow: string[]; crawlDelayMs: number | null }[] = [];
  let current: { agent: string[]; allow: string[]; disallow: string[]; crawlDelayMs: number | null } | null = null;
  const sitemaps: string[] = [];
  let crawlDelayGlobal: number | null = null;

  const lines = body.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (COMMENT_OR_BLANK.test(line) || raw.trim().length === 0) continue;
    if (!isDirective(line)) continue;

    const uaMatch = line.match(UA_GROUP_RE);
    if (uaMatch) {
      const agent = (uaMatch[1] as string).trim().toLowerCase();
      if (current === null || current.agent.length === 0 || current.agent[0] === '*') {
        current = { agent: [agent], allow: [], disallow: [], crawlDelayMs: null };
        blocks.push(current);
      } else {
        // يولّد بدء مجموعة جديدة عند تتابع agent مختلف — حسب ملف robots القياسي،
        // كل سطر User-agent يفتح مجموعة جديدة.
        current = { agent: [agent], allow: [], disallow: [], crawlDelayMs: null };
        blocks.push(current);
      }
      continue;
    }
    if (!current) continue;

    const all = line.match(ALLOW_RE);
    if (all) {
      current.allow.push((all[1] as string).trim());
      continue;
    }
    const dis = line.match(DISALLOW_RE);
    if (dis) {
      current.disallow.push((dis[1] as string).trim());
      continue;
    }
    const delay = line.match(DELAY_RE);
    if (delay) {
      const v = parseFloat(delay[1] as string);
      if (Number.isFinite(v)) {
        current.crawlDelayMs = Math.round(v * 1000);
        crawlDelayGlobal = Math.round(v * 1000);
      }
      continue;
    }
    const sm = line.match(SITEMAP_RE);
    if (sm) {
      sitemaps.push((sm[1] as string).trim());
      continue;
    }
  }

  const selected = selectRules(blocks, userAgentToken);

  // في حالة وجود قاعدة صريحة عامة ضمن السطور غير المتعلقة بمجموعة، نأخذها كاحتياط.
  const a = selected.allow.length ? selected.allow : [];
  const d = selected.disallow.length ? selected.disallow : [];
  return {
    allow: a,
    disallow: d,
    crawlDelayMs: selected.crawlDelayMs ?? crawlDelayGlobal,
    sitemaps,
  };
}

/**
 * هل يسمح robots.txt بزيارة path؟
 * قواعد Google: التطابق على البادئة مع أطول مسار فائز؛ فصل Allow وDisallow معًا.
 */
export function robotsAllows(rules: RobotsRules, path: string): boolean {
  const candidates = [
    ...rules.allow.map((p) => ({ pattern: p, allows: true as const })),
    ...rules.disallow.map((p) => ({ pattern: p, allows: false as const })),
  ];
  if (candidates.length === 0) return true;
  const matches = candidates.filter((c) => patternMatchesPath(c.pattern, path));
  if (matches.length === 0) return true;
  matches.sort((a, b) => b.pattern.length - a.pattern.length);
  return matches[0]!.allows;
}