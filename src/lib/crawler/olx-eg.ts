/**
 * مُكيّف مصدر OLX مصر (dubizzle) — يعتمد على JSON-LD المضمّن في صفحة البحث
 * (`application/ld+json` من نوع ItemList/CollectionPage) بدل كشط HTML الهش.
 * عيّنة حقيقية مؤكدة (سبتمبر 2026): كل بند من نوع RealEstateListing يحمل
 * offers.price (رقم، EGP) + offers.url + العنوان + العنوان الجغرافي.
 *
 * لا نطالب بأي صفحة تتطلب تسجيل دخول أو كابتشا — الصفحة العامة فقط.
 */

import type { ParsedListing } from '@/lib/crawler/types';

export interface OlxSearchConfig {
  /** معرّف الفئة في المصدر (مثل apartments-duplex-for-rent). */
  category: string;
  /** مدينة محددة اختيارية (تُنمّط المُنقّد كما في الرابط الحقيقي). */
  city?: string;
  /** كلمة بحث اختيارية (تُنمّط إلى slug). */
  query?: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\u0600-\u06FF-]/g, (ch) => (ch === '-' ? '-' : encodeURIComponent(ch)))
    .replace(/-+/g, '-')
    .toLowerCase();
}

function encodeQuery(value: string): string {
  return encodeURIComponent(value.trim());
}

export function buildSearchUrl(baseUrl: string, config: OlxSearchConfig): string {
  const root = baseUrl.replace(/\/+$/, '');
  const category = config.category.trim();
  const q = config.query?.trim();
  const city = config.city?.trim();
  if (!category) throw new Error('olx-eg: category مطلوبة');
  // الصيغة الحقيقية المؤكدة: الصفحة العامة بالأولوية مع «مدينة» على شكل مسار مقسوم:
  // /en/i2/properties/{category}/{city}/q-{query}
  // وبدون مدينة: /en/properties/{category}/q-{query}
  if (city) {
    const parts = [root, '/en/i2/properties/', category, '/', slugify(city)];
    if (q) parts.push('/q-', encodeQuery(q));
    return parts.join('');
  }
  const path = `${root}/en/properties/${category}`;
  return q ? `${path}/q-${encodeQuery(q)}` : path;
}

const JSONLD_BLOCK_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const ID_FROM_URL_RE = /-ID(\d+)\.html$/i;

/** استخراج كل سكربتات ld+json ومعالجتها إلى كائنات. */
export function extractJsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  let m: RegExpExecArray | null;
  JSONLD_BLOCK_RE.lastIndex = 0;
  while ((m = JSONLD_BLOCK_RE.exec(html)) !== null) {
    const raw = (m[1] as string).trim();
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw));
    } catch {
      // سكربت مقطوع/مشوه — نتجاهله بصمت ولا نُفشل الدفعة كلها.
    }
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** غوص متدرّج: itemListElement في الجذر أو mainEntity أو داخل @graph (بنية OLX الحية). */
function findItemListElement(node: Record<string, unknown>): unknown {
  if (Array.isArray(node.itemListElement)) return node.itemListElement;
  if (isRecord(node.mainEntity)) {
    const me = node.mainEntity as Record<string, unknown>;
    if (Array.isArray(me.itemListElement)) return me.itemListElement;
  }
  const graph = node['@graph'];
  if (Array.isArray(graph)) {
    for (const g of graph) {
      if (!isRecord(g)) continue;
      const inner = findItemListElement(g);
      if (inner !== undefined) return inner;
    }
  }
  return undefined;
}

function findNumberField(node: Record<string, unknown>, key: string): number | null {
  const direct = firstNumber(node[key]);
  if (direct !== null) return direct;
  if (isRecord(node.mainEntity)) {
    const inner = firstNumber((node.mainEntity as Record<string, unknown>)[key]);
    if (inner !== null) return inner;
  }
  const graph = node['@graph'];
  if (Array.isArray(graph)) {
    for (const g of graph) {
      if (!isRecord(g)) continue;
      const inner = findNumberField(g, key);
      if (inner !== null) return inner;
    }
  }
  return null;
}

interface LdListing {
  name?: string;
  url?: string;
  offers?: Record<string, unknown>;
  mainEntity?: Record<string, unknown>;
  datePublished?: unknown;
  dateCreated?: unknown;
  dateModified?: unknown;
}

/** استخراج بنود ItemList من سكربت JSON-LD (يدعم الشكلين الشائعين معًا). */
export function extractListingsFromJson(json: unknown): LdListing[] {
  if (!isRecord(json)) return [];
  const root: Record<string, unknown> = json;
  const itemList = findItemListElement(root);
  if (!Array.isArray(itemList)) return [];
  const out: LdListing[] = [];
  for (const el of itemList) {
    if (!isRecord(el)) continue;
    const item = isRecord(el.item) ? (el.item as Record<string, unknown>) : el;
    if (!isRecord(item)) continue;
    if ((item['@type'] as string)?.includes('RealEstateListing') === false) continue;
    out.push(item as LdListing);
  }
  return out;
}

function firstText(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
}

function firstNumber(...candidates: unknown[]): number | null {
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
    if (typeof c === 'string' && c.trim() !== '' && Number.isFinite(Number(c))) return Number(c);
  }
  return null;
}

const PROPERTY_TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/^studio\b|\bstudio\b|\bاستوديو\b|\bستوديو\b/i, 'studio'],
  [/^penthouse\b|penthouse|بنتهاوس/i, 'penthouse'],
  [/^duplex\b|\bduplex\b|\bدوبلكس\b/i, 'duplex'],
  [/^roof\b|\broof\b|\bروف\b/i, 'roof'],
  [/^villa\b|\bvilla\b|\bفيلا\b/i, 'villa'],
  [/^townhouse\b|townhouse|تاون\s*هاوس/i, 'townhouse'],
  [/^chalet\b|\bchalet\b|\bشاليه\b|\bشالي\b/i, 'chalet'],
  [/^shop\b|\bshop\b|\bمحل\b/i, 'shop'],
  [/office|مكتب|مكتبي|اداري|إداري/i, 'office'],
  [/apartment|شقة|شقه|سكن/i, 'apartment'],
];

export function detectPropertyType(name: string, entityType: string): string | null {
  const hay = `${entityType} ${name}`.toLowerCase();
  for (const [re, id] of PROPERTY_TYPE_PATTERNS) {
    if (re.test(hay)) return id;
  }
  return null;
}

const FINISHING_PATTERNS: Array<[RegExp, string]> = [
  [/super\s*lux|سوبر\s*لوكس|super\s*luxury/i, 'super-lux'],
  [/^lux|luxury|لوكس|فاخر/i, 'lux'],
  [/average|متوسط/i, 'average'],
  [/basic|unfinished|semi.?finish|عادي|ساده|تشطيب\s*جزئي/i, 'basic'],
];

export function detectFinishing(...values: Array<string | null>): string | null {
  for (const v of values) {
    if (!v) continue;
    for (const [re, id] of FINISHING_PATTERNS) {
      if (re.test(v)) return id;
    }
  }
  return null;
}

export function extractExternalId(url: string): string {
  const m = url.match(ID_FROM_URL_RE);
  if (m) return m[1] as string;
  // بديل مستقر عند غياب المعرف الرقمي.
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) >>> 0;
  }
  return `h${h.toString(36)}`;
}

function findTextInProps(mainEntity: Record<string, unknown>, names: string[]): string | null {
  const props = mainEntity.additionalProperty;
  if (!Array.isArray(props)) return null;
  for (const p of props) {
    if (!isRecord(p)) continue;
    const key = firstText(p.name, p.propertyName, p['@type']);
    if (!key) continue;
    if (names.some((n) => key.toLowerCase().includes(n.toLowerCase()))) {
      const v = firstText(p.value);
      if (v) return v;
    }
  }
  return null;
}

function extraNumbers(mainEntity: Record<string, unknown>, names: string[]): number | null {
  const props = mainEntity.additionalProperty;
  if (!Array.isArray(props)) return null;
  for (const p of props) {
    if (!isRecord(p)) continue;
    const key = firstText(p.name, p.propertyName);
    if (!key) continue;
    if (names.some((n) => key.toLowerCase().includes(n.toLowerCase()))) {
      const n = firstNumber(p.value);
      if (n !== null) return n;
    }
  }
  return null;
}

/** تطبيع بند JSON-LD RealEstateListing إلى ParsedListing. */
export function normalizeLdListing(item: LdListing): ParsedListing | null {
  const offers = isRecord(item.offers) ? item.offers : null;
  const price = offers ? firstNumber(offers.price) : null;
  const url = firstText(item.url) ?? null;
  if (price === null || !url) return null;

  const main: Record<string, unknown> = isRecord(item.mainEntity) ? item.mainEntity : {};
  const entityType = typeof main['@type'] === 'string' ? main['@type'] : '';
  const name = item.name ?? '';

  const address = isRecord(main.address) ? main.address : null;
  const locality = address ? firstText(address.addressLocality) : null;
  const region = address ? firstText(address.addressRegion) : null;

  const spec = offers && isRecord(offers.priceSpecification) ? offers.priceSpecification : null;
  const unitRaw = spec ? firstText(spec.unitText) : null;
  let rentalFrequency: ParsedListing['rentalFrequency'] = null;
  if (unitRaw) {
    const u = unitRaw.toUpperCase();
    if (u.startsWith('MONTH')) rentalFrequency = 'monthly';
    else if (u.startsWith('DAY')) rentalFrequency = 'daily';
    else if (u.startsWith('ANN') || u.startsWith('YEAR')) rentalFrequency = 'yearly';
  }

  const floors = isRecord(main.floorSize) ? main.floorSize : null;
  const area = floors ? firstNumber(floors.value) : null;

  const dateRaw = firstText(item.datePublished, item.dateCreated, item.dateModified);
  let listedAt: number | null = null;
  if (dateRaw) {
    const t = new Date(dateRaw).getTime();
    if (Number.isFinite(t) && t > 0) listedAt = t;
  }

  let city = locality ?? null;
  if (!city && offers) {
    const offerAt: unknown = offers.availableAtOrFrom;
    if (isRecord(offerAt)) city = firstText((offerAt as Record<string, unknown>).name) ?? null;
  }

  const finishing = detectFinishing(
    findTextInProps(main, ['Finishing', 'Completion Status']),
    entityType,
  );

  return {
    externalId: extractExternalId(url),
    title: typeof name === 'string' ? name : url,
    url,
    price: Math.round(price),
    currency: offers ? firstText(offers.priceCurrency) ?? 'EGP' : 'EGP',
    city,
    governorate: region,
    propertyType: detectPropertyType(typeof name === 'string' ? name : '', entityType),
    finishing,
    rooms: firstNumber(main.numberOfBedrooms) ?? extraNumbers(main, ['Bedrooms', 'Rooms']),
    bathrooms: firstNumber(main.numberOfBathroomsTotal) ?? extraNumbers(main, ['Bathrooms', 'bath']),
    areaM2: area,
    rentalFrequency,
    listedAt,
    sourceUrl: url,
  };
}

export interface OlxParseResult {
  items: ParsedListing[];
  totalAvailable: number | null;
}

/** يُحلِّل HTML صفحة بحث OLX إلى إعلانات مطبّعة. لا يلمس الشبكة. */
export function parseOlxSearchHtml(html: string): OlxParseResult {
  const blocks = extractJsonLdBlocks(html);
  const listings: ParsedListing[] = [];
  let totalAvailable: number | null = null;
  for (const block of blocks) {
    if (!isRecord(block)) continue;
    const itemList = findItemListElement(block);
    if (Array.isArray(itemList)) {
      const count = findNumberField(block, 'numberOfItems');
      if (count !== null) totalAvailable = Math.round(count);
      for (const el of itemList) {
        if (!isRecord(el)) continue;
        const item = isRecord(el.item) ? (el.item as Record<string, unknown>) : el;
        const normalized = normalizeLdListing(item as LdListing);
        if (normalized) listings.push(normalized);
      }
    }
  }
  // إزالة التكرار بنفس المعرف الرقمي (أول حدوث يفوز).
  const seen = new Set<string>();
  const unique = listings.filter((l) => {
    const k = l.externalId;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { items: unique, totalAvailable };
}

/** هل استجابة HTTP تشير لحماية تتطلب جمعًا يدويًا؟ تُرجع سبب الحظر. */
export function reasonForStatus(status: number): { reason: import('@/lib/crawler/types').BlockReason; note?: string } | null {
  if (status === 401 || status === 403) return { reason: status === 401 ? 'login' : 'protected' };
  if (status === 429) return { reason: 'captcha', note: 'لوحة سرعة (429) — تُحفظ للجمع اليدوي' };
  if (status === 404) return { reason: 'blocked', note: 'الصفحة غير موجودة (404)' };
  if (status >= 400) return { reason: 'blocked', note: `استجابة ${status} — لا نكرر الطلب` };
  return null;
}