/**
 * مُكيّف مصدر السوق المفتوح مصر (OpenSooq) — يعتمد على JSON-LD المضمّن في
 * صفحة البحث (الكتلة الثانية من ld+json: `@graph[2].itemListElement`).
 * عيّنة حقيقية مؤكدة (سبتمبر 2026): كل بند Offer يحمل priceSpecification
 * (price بالسعر، EGP) + itemOffered (Apartment: name, url, address عربي).
 *
 * خلاف OLX:
 * - المحافظة والحي عربيان أصلاً (addressRegion/addressLocality) فلا نحتاج ترجمة.
 * - التردد (شهري/يومي/سنوي) غير معلن ميتاتًا — نستخلصه من نص العنوان.
 * - الـ JSON-LD لا يحمل غرف/حمام/مساحة — لكن بطاقات نتائج البحث (HTML)
 *   تعرضها صريحًا (مساحة/غرف/حمامات) فنستخرجها من البطاقات ونمزجها.
 * - إعلانات «مطلوب» طلبات لا عروض — تُستبعد تمامًا.
 *
 * لا نطالب بأي صفحة تتطلب تسجيل دخول أو كابتشا — الصفحة العامة فقط.
 */

import type { ParsedListing, SourceParser } from '@/lib/crawler/types';
import { detectPropertyType, detectFinishing, extractJsonLdBlocks } from '@/lib/crawler/olx-eg';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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

/**
 * العثور على قائمة الإعلانات الحقيقية في بنية @graph.
 * التفضيل الدلالي: العقدة (أو mainEntity) من نوع ItemList — وليس BreadcrumbList
 * التي تحمل مسارات شجكيلة، وإن غابت ItemList نأخذ أطول مصفوفة بغض النهي.
 */
function findOpenSooqItemList(graph: unknown[]): unknown[] | null {
  let best: unknown[] | null = null;
  let bestLen = 0;
  const consider = (arr: unknown): void => {
    if (!Array.isArray(arr)) return;
    if (arr.length > bestLen) {
      best = arr;
      bestLen = arr.length;
    }
  };
  const typeHasItemList = (v: unknown): boolean => {
    if (!isRecord(v)) return false;
    const t = String(v['@type'] ?? '');
    return /ItemList/.test(t);
  };
  for (const node of graph) {
    if (!isRecord(node)) continue;
    const nodeList = node.itemListElement;
    const me = isRecord(node.mainEntity) ? (node.mainEntity as Record<string, unknown>) : null;
    if (Array.isArray(nodeList) && (typeHasItemList(node) || typeHasItemList(node.mainEntity))) {
      return nodeList as unknown[];
    }
    if (me && Array.isArray(me.itemListElement) && typeHasItemList(me)) {
      return me.itemListElement as unknown[];
    }
    consider(nodeList);
    if (me) consider(me.itemListElement);
  }
  return best;
}

/** التردد من نص العنوان: يومي/سنوي صريحان؛ غير المعلن = شهركي (null تُعامل شهريًا). */
export function detectOpenSooqFrequency(title: string): ParsedListing['rentalFrequency'] {
  const t = title.toLowerCase();
  if (/(يومى|يومي|باليوم|ايجار\s*ايام|أيام|للأيام)/.test(t)) return 'daily';
  if (/(سنوى|سنوي|سنويا|بالسنة|سنوياً)/.test(t)) return 'yearly';
  return null;
}

/** طلبات «مطلوب شقة» = ليس عرضًا؛ تُستبعد حتى لا تلوّث الوسيط. */
export function isWantedListing(title: string): boolean {
  return /(?:^|\s)(مطلوب|أحتاج|بحاجة|نبحث|أبحث|أرغب|أريد|عايز|عاوز|محتاج|بحثا)(?:\s|$)/.test(title.trim());
}

const OPENSOOQ_ID_RE = /\/search\/(\d+)(?:[?#]|$)/;

function extractOpenSooqExternalId(url: string): string {
  const m = url.match(OPENSOOQ_ID_RE);
  if (m) return m[1] as string;
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) >>> 0;
  }
  return `h${h.toString(36)}`;
}

const AREA_RE = /(\d{2,4})(?:\s*م(?:تر|2|²)?)/u;

/** مساحة من نص العنوان إن وُجدت (مثل «شقة 130م للإيجار»). */
function extractAreaFromTitle(title: string): number | null {
  const m = title.match(AREA_RE);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) && v > 10 && v < 20000 ? v : null;
}

export function normalizeOpenSooqListing(item: Record<string, unknown>): ParsedListing | null {
  const offerAt = isRecord(item.itemOffered) ? (item.itemOffered as Record<string, unknown>) : null;
  if (!offerAt) return null;

  const name = firstText(offerAt.name);
  const url = firstText(offerAt.url);
  const spec = isRecord(item.priceSpecification) ? item.priceSpecification : null;
  const price = spec ? firstNumber(spec.price) : null;
  if (!name || !url || price === null) return null;

  // طلبات، لا عروض.
  if (isWantedListing(name)) return null;

  const address = isRecord(offerAt.address) ? (offerAt.address as Record<string, unknown>) : null;
  const locality = address ? firstText(address.addressLocality) : null;
  const region = address ? firstText(address.addressRegion) : null;
  const urlReal = url || (typeof item['@id'] === 'string' ? item['@id'] : '') || '';

  const freq = detectOpenSooqFrequency(name);

  return {
    externalId: extractOpenSooqExternalId(urlReal),
    title: name,
    url: urlReal,
    price: Math.round(price),
    currency: spec ? firstText(spec.priceCurrency) ?? 'EGP' : 'EGP',
    city: locality,
    governorate: region,
    propertyType: detectPropertyType(name, 'Apartment'),
    finishing: detectFinishing(name),
    rooms: null,
    bathrooms: null,
    areaM2: extractAreaFromTitle(name),
    rentalFrequency: freq,
    listedAt: null,
    sourceUrl: urlReal,
  };
}

export const opensooqParser: SourceParser = {
  parseSearchHtml(html: string): { items: ParsedListing[]; totalAvailable: number | null } {
    const blocks = extractJsonLdBlocks(html);
    // نمسح كل الكتل بحثًا عن @graph يحتوي itemListElement — لا نعتمد على ترتيب السكربتات.
    let itemList: unknown[] | null = null;
    for (const block of blocks) {
      if (!isRecord(block)) continue;
      const graph = block['@graph'];
      if (!Array.isArray(graph)) continue;
      const found = findOpenSooqItemList(graph as unknown[]);
      if (found) { itemList = found; break; }
    }
    if (!itemList) return { items: [], totalAvailable: null };

    const items: ParsedListing[] = [];
    for (const el of itemList) {
      const entry = isRecord(el) ? el : null;
      if (!entry) continue;
      // بنية ListItem الحية: { item: { @type: "Offer", ... } } — نفُك التعشيش.
      const offer = isRecord(entry.item) ? (entry.item as Record<string, unknown>) : entry;
      if (!isRecord(offer)) continue;
      const normalized = normalizeOpenSooqListing(offer);
      if (normalized) items.push(normalized);
    }

    // إثراء بالغرف/الحمامات/المساحة من بطاقات HTML (الـ JSON-LD لا يحملها).
    const cardDetails = extractOpenSooqCardDetails(html);
    for (const l of items) {
      const extra = cardDetails[l.externalId];
      if (!extra) continue;
      if (extra.rooms !== null && l.rooms === null) l.rooms = extra.rooms;
      if (extra.bathrooms !== null && l.bathrooms === null) l.bathrooms = extra.bathrooms;
      if (extra.areaM2 !== null && l.areaM2 === null) l.areaM2 = extra.areaM2;
    }

    // إزالة التكرار بنفس المعرف الرقمي (أول حدوث يفوز).
    const seen = new Set<string>();
    const unique = items.filter((l) => {
      const k = l.externalId;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { items: unique, totalAvailable: null };
  },
};

/** أرقام عربية مشرقية (٠-٩) → لاتينية. */
function toLatinDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

const ARABIC_WORDS_TO_NUM: Record<string, number> = {
  'حمّام': 1, 'حمام': 1, 'دورة مياه': 1, 'دورة مياه واحدة': 1,
  'حمّامين': 2, 'حمامين': 2, 'دورتي مياه': 2,
};

/**
 * يستخرج {غرف، حمامات، مساحة} من بطاقات نتائج البحث المعروضة (HTML RSC).
 * البطاقة تحمل `data-id1="286745220"` وضمنها أيقونات:
 *   alt="المساحة: 94 م2"، alt="2 غرفتا نوم"، alt="حمّامين".
 * يعيد Map بالمُعرف الرقمي → التفاصيل (null عندما لا توجد البطاقة أو الحقل).
 */
export function extractOpenSooqCardDetails(html: string): Record<string, { rooms: number | null; bathrooms: number | null; areaM2: number | null }> {
  const out: Record<string, { rooms: number | null; bathrooms: number | null; areaM2: number | null }> = {};
  // كل بطاقة كتلة `<a ... data-id1="N"/data-post-index>` حتى البطاقة التالية أو نهاية HTML.
  const cardRe = /data-id1="(\d+)"[\s\S]*?(?=data-id1="|<\/body>|$)/g;
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(html)) !== null) {
    const id = m[1] as string;
    const card = m[0];
    const details = { rooms: null as number | null, bathrooms: null as number | null, areaM2: null as number | null };

    // المساحة: alt="المساحة: 94 م2"
    const areaMatch = card.match(/star_cps\/area\.webp"\s+alt="[^"]*?([0-9٠-٩]{2,4})\s*م2/);
    if (areaMatch) {
      const v = Number(toLatinDigits(areaMatch[1] as string));
      if (Number.isFinite(v) && v > 10 && v < 20000) details.areaM2 = v;
    }

    // الغرف: alt="2 غرفتا نوم" / "3 غرف نوم" / "استوديو"
    const roomsMatch = card.match(/star_cps\/bedrooms\.webp"\s+alt="[^"]*?([0-9٠-٩])\s*غرف/);
    if (roomsMatch) {
      const v = Number(toLatinDigits(roomsMatch[1] as string));
      if (Number.isFinite(v) && v >= 0 && v <= 15) details.rooms = v;
    } else if (/star_cps\/bedrooms\.webp"\s+alt="[^"]*استوديو/i.test(card)) {
      details.rooms = 1; // الاستوديو يُحتسب غرفة واحدة في مؤشرنا
    }

    // الحمامات: alt="حمّام" / "حمّامين" / "٣ حمّامات" / "دورة مياه"
    const bathAlt = card.match(/star_cps\/bathrooms\.webp"\s+alt="([^"]+)"/);
    if (bathAlt) {
      const text = (bathAlt[1] as string).trim();
      if (ARABIC_WORDS_TO_NUM[text] !== undefined) {
        details.bathrooms = ARABIC_WORDS_TO_NUM[text] as number;
      } else {
        const n = text.match(/([0-9٠-٩]+)\s*حم-?ّ?امات/);
        if (n) {
          const v = Number(toLatinDigits(n[1] as string));
          if (Number.isFinite(v) && v >= 1 && v <= 15) details.bathrooms = v;
        }
      }
    }

    out[id] = details;
  }
  return out;
}