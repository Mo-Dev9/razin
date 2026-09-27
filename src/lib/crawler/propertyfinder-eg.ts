/**
 * مُكيّف مصدر Property Finder مصر — يعتمد على بطاقات نتائج البحث المُرتَقِدة
 * سيرفر-سايد (RSC) مباشرة في HTML: كل بطاقة `<h3 id="plp-<id>">` داخل
 * `data-testid="property-card-price"`، والسعر صريح «95,000 EGP/month».
 * عيّنة حقيقية مؤكدة (سبتمبر 2026): 22 بطاقة في أول صفحة، رابط التفصيل
 * `https://www.propertyfinder.eg/en/plp/rent/...-<id>.html`، ومواصفات
 * الغرف/الحمامات/المساحة/النوع عبر data-testid المستقرة.
 *
 * أدب الزحف (مؤكد حيًّا): robots.txt يعيد 200 للزاحف الصريح، وصفحات البحث
 * `/en/rent/...` مسموحة، ومعامل `?page=N` غير ممنوع — لا حماية ولا كابتشا.
 *
 * الجغرافيا: العنوان الإنجليزي ليس عربيًا — نستخرج المدينة من slug الرابط
 * (`cairo-new-cairo-city-...`) بمطابقة SOURCE_EN_ALIASES، ويُفلترح «الأكثر
 * تخصيصًا»: alias أعمق مقطع يسابق أسبق (فلا تحجب المظلة «القاهرة الجديدة»
 * حيًّا أدق كالتجمع الخامس/مدينتي)، والمحافظة من أول مقطع — سلوك OLX نفسه.
 */

import type { ParsedListing, SourceParser } from '@/lib/crawler/types';
import { detectPropertyType, detectFinishing, detectFurnished } from '@/lib/crawler/olx-eg';
import { resolveEnPlace } from '@/lib/listing-utils';

/** رابط تفصيل الإعلان الحامل للمعرّف الرقمي في نهايته (مصدر المعرف ليس h3 فقط). */
const DETAIL_LINK_RE = /https:\/\/www\.propertyfinder\.eg\/en\/plp\/[^"'\s<>]+?-(\d+)\.html/gi;

/** كل بطاقة تبدأ بحاوية سعرها؛ التقسيم على `data-testid="property-card-price"`. */
const CARD_SPLIT = 'data-testid="property-card-price"';

/** نص داخل بطاقة حسب data-testid للمواصفة (يكسو أي SVG ثم يأخذ ما قبل `</p>`). */
function specText(card: string, name: string): string | null {
  const re = new RegExp(`data-testid="property-card-spec-${name}"[^>]*>(?:<svg[\\s\\S]*?<\\/svg>)?\\s*([^<]{1,60})`);
  const m = card.match(re);
  return m ? m[1].trim() : null;
}

/**
 * مدينة/محافظة من slug رابط التفصيل (`...-cairo-new-cairo-city-the-5th-settlement-<id>.html`).
 * نمسح كل المقاطع (بعد مقطع المحافظة الأول) ونختار «الأكثر تخصيصًا»: alias
 * يبدأ في أعمق موضع (آخر بداية)، وعند تساوي البداية يكسب الأطول — حتى لا
 * تحجب المظلةُ حيًّا أدق («new cairo city» لا يخفي «5th settlement»)، ولا تبقى
 * المظلة لغير المشتقّات. الاحتياط نص خام غير مختلق. المحافظة من أول مقطع.
 */
export function extractPfPlace(pageUrl: string): { city: string | null; governorate: string | null } {
  try {
    const path = new URL(pageUrl).pathname;
    const m = path.match(/\/plp\/rent\/[a-z0-9-]+-for-rent-([a-z0-9-]+)-\d+\.html$/i);
    if (!m) return { city: null, governorate: null };
    const tokens = (m[1] as string).split('-').filter(Boolean);
    let best: { start: number; len: number; value: string } | null = null;
    for (let start = 1; start < tokens.length; start++) {
      for (let len = 1; len + start <= tokens.length; len++) {
        const cand = tokens.slice(start, start + len).join(' ');
        if (resolveEnPlace(cand)) {
          if (!best || start > best.start || (start === best.start && len > best.len)) {
            best = { start, len, value: cand };
          }
        }
      }
    }
    const governorate = tokens[0] ?? null;
    if (best) return { city: best.value, governorate };
    return { city: tokens.join(' '), governorate };
  } catch {
    return { city: null, governorate: null };
  }
}

/** معرف خارجي ثابت: رقم نهاية رابط التفصيل (مصدر الحقيقة — لا يُصطنع). */
export function extractPfExternalId(pageUrl: string): string | null {
  const m = pageUrl.match(/-(\d+)\.html$/);
  return m ? m[1] : null;
}

/** تحويل بطاقة واحدة إلى إعلان مطبَّع؛ أي بطاقة ناقصة السعر تُتخطى. */
export function normalizePfListing(
  card: string,
  info: { id: string; title: string; url: string }
): ParsedListing | null {
  if (!card || !info.title || !info.url) return null;

  // السعر: يبدأ النص مباشرة بعد `data-testid="property-card-price">` ثم «EGP/month».
  const priceM = card.match(/^\s*>\s*([\d,]+)\s*EGP\s*\/\s*(month|day|week|year)\b/i);
  if (!priceM) return null;
  const price = Number((priceM[1] as string).replace(/,/g, ''));
  if (!Number.isFinite(price) || price <= 0) return null;
  const freqRaw = (priceM[2] as string).toLowerCase();
  const rentalFrequency: ParsedListing['rentalFrequency'] =
    freqRaw === 'month' ? 'monthly' : freqRaw === 'year' ? 'yearly' : 'daily';

  const bedText = specText(card, 'bedroom');
  const bathText = specText(card, 'bathroom');
  const areaText = specText(card, 'area');
  const typeText = specText(card, 'propertyType');

  let rooms: number | null = null;
  if (bedText !== null) {
    if (/studio/i.test(bedText)) rooms = 1; // استوديو يُحتسب غرفة واحدة في مؤشرنا
    else {
      const n = bedText.match(/\d+/);
      if (n) {
        const v = Number(n[0]);
        if (Number.isFinite(v) && v >= 0 && v <= 15) rooms = v;
      }
    }
  }
  let bathrooms: number | null = null;
  if (bathText !== null) {
    const n = bathText.match(/\d+/);
    if (n) {
      const v = Number(n[0]);
      if (Number.isFinite(v) && v >= 0 && v <= 15) bathrooms = v;
    }
  }
  let areaM2: number | null = null;
  if (areaText !== null) {
    const m = areaText.match(/(\d{2,4})\s*m/i);
    if (m) {
      const v = Number(m[1]);
      if (Number.isFinite(v) && v > 10 && v < 20000) areaM2 = v;
    }
  }

  const place = extractPfPlace(info.url);

  return {
    externalId: info.id,
    title: info.title,
    url: info.url,
    price: Math.round(price),
    currency: 'EGP',
    city: place.city,
    governorate: place.governorate,
    propertyType: detectPropertyType(info.title, typeText ?? ''),
    finishing: detectFinishing(info.title),
    furnished: detectFurnished(info.title),
    rooms,
    bathrooms,
    areaM2,
    rentalFrequency,
    listedAt: null,
    sourceUrl: info.url,
  };
}

/** جمع روابط التفصيل الكاملة (المعرّف → الرابط) من كل HTML. */
export function extractDetailLinks(html: string): Map<string, string> {
  const out = new Map<string, string>();
  DETAIL_LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DETAIL_LINK_RE.exec(html)) !== null) {
    out.set(m[1] as string, m[0]);
  }
  return out;
}

/** عدد الإعلانات المتاحة من عنصر العنوان: «Apartments for rent in Cairo - 31,607 Flats for rent ...». */
export function extractPfTotal(html: string): number | null {
  const m = html.match(/-\s*([\d,]+)\s+Flats?\s+for\s+rent/i);
  if (!m) return null;
  const v = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(v) ? v : null;
}

export const propertyfinderParser: SourceParser = {
  parseSearchHtml(html: string): { items: ParsedListing[]; totalAvailable: number | null } {
    const links = extractDetailLinks(html);
    const items: ParsedListing[] = [];
    const cards = html.split(CARD_SPLIT);
    // المقطع الأول قبل أي بطاقة (رأس الصفحة) — يُتخطى.
    for (let i = 1; i < cards.length; i++) {
      const card = cards[i] as string;
      const idMatch = card.match(/<h3[^>]*id="plp-(\d+)"[^>]*>(.*?)<\/h3>/);
      if (!idMatch) continue;
      const id = idMatch[1] as string;
      const title = (idMatch[2] as string).replace(/<[^>]+>/g, '').trim();
      const url = links.get(id);
      if (!url) continue;
      const normalized = normalizePfListing(card, { id, title, url });
      if (normalized) items.push(normalized);
    }
    const seen = new Set<string>();
    const unique = items.filter((l) => {
      if (seen.has(l.externalId)) return false;
      seen.add(l.externalId);
      return true;
    });
    return { items: unique, totalAvailable: extractPfTotal(html) };
  },
};