import { normalizeSearchText, EGYPT_GOVERNORATES, matchLocation } from '@/lib/egypt-cities';

/**
 * مفتاح الحي الوحيد في الرسم الهرمي — مخزّن كمعرّف مستند neighborhoods/{id}.
 * يوحّد الهمزات والتاء المربوطة والألف المقصورة ويتخلص من المسافات حتى تتجمع
 * سجلات الحي نفسه، وعند تكرار الاسم عبر محافظات (مثل «دار السلام») تُضاف
 * لاحقة المحافظة لفكّ التعارض.
 */
const FALLBACK_CITY = 'غير محدد';

/**
 * أسماء المدن/الأحياء كما يكتبها المصدر (OLX/dubizzle بالإنجليزية غالبًا)
 * → الاسم الرسمي العربي + المحافظة الرسمية. تُفكّ عند الاستخراج فقط حتى لا
 * يفسد الزحف الرسم البياني العربي الذي يواجهه المستخدم (بحث/سايت ماب/صفحة).
 */
export const SOURCE_EN_ALIASES: Readonly<Record<string, { city: string; governorate: string }>> = {
  // القاهرة
  'nasr city': { city: 'مدينة نصر', governorate: 'القاهرة' },
  'new cairo': { city: 'القاهرة الجديدة', governorate: 'القاهرة' },
  'new cairo city': { city: 'القاهرة الجديدة', governorate: 'القاهرة' },
  'fifth settlement': { city: 'التجمع الخامس', governorate: 'القاهرة' },
  'fifth settlement new cairo': { city: 'التجمع الخامس', governorate: 'القاهرة' },
  'first settlement': { city: 'التجمع الأول', governorate: 'القاهرة' },
  'madinaty': { city: 'مدينتي', governorate: 'القاهرة' },
  'madinaty city': { city: 'مدينتي', governorate: 'القاهرة' },
  'heliopolis': { city: 'مصر الجديدة', governorate: 'القاهرة' },
  'masr el gedida': { city: 'مصر الجديدة', governorate: 'القاهرة' },
  'maadi': { city: 'المعادي', governorate: 'القاهرة' },
  'zahraa al maadi': { city: 'زهراء المعادي', governorate: 'القاهرة' },
  'zahraa el maadi': { city: 'زهراء المعادي', governorate: 'القاهرة' },
  'mokattam': { city: 'المقطم', governorate: 'القاهرة' },
  'muqattam': { city: 'المقطم', governorate: 'القاهرة' },
  'sayeda zeinab': { city: 'السيدة زينب', governorate: 'القاهرة' },
  'sayyida zainab': { city: 'السيدة زينب', governorate: 'القاهرة' },
  'downtown cairo': { city: 'وسط البلد', governorate: 'القاهرة' },
  'downtown': { city: 'وسط البلد', governorate: 'القاهرة' },
  'zamalek': { city: 'الزمالك', governorate: 'القاهرة' },
  'garden city': { city: 'جاردن سيتي', governorate: 'القاهرة' },
  'garden city cairo': { city: 'جاردن سيتي', governorate: 'القاهرة' },
  'shubra': { city: 'شبرا', governorate: 'القاهرة' },
  'shoubra': { city: 'شبرا', governorate: 'القاهرة' },
  'ain shams': { city: 'عين شمس', governorate: 'القاهرة' },
  'matariya': { city: 'المطرية', governorate: 'القاهرة' },
  'nozha': { city: 'النزهة', governorate: 'القاهرة' },
  'helwan': { city: 'حلوان', governorate: 'القاهرة' },
  'maadi degla': { city: 'المعادي', governorate: 'القاهرة' },
  'badr city': { city: 'مدينة بدر', governorate: 'القاهرة' },
  'zaitoun': { city: 'الزيتون', governorate: 'القاهرة' },
  '15th may city': { city: 'مدينة الـ15 من مايو', governorate: 'القاهرة' },
  '15 may city': { city: 'مدينة الـ15 من مايو', governorate: 'القاهرة' },
  'new heliopolis': { city: 'مصر الجديدة', governorate: 'القاهرة' },
  'rehab city': { city: 'الرحاب', governorate: 'القاهرة' },
  'shorouk': { city: 'الشروق', governorate: 'القاهرة' },
  'shorouk city': { city: 'الشروق', governorate: 'القاهرة' },
  '10th of ramadan': { city: 'العاشر من رمضان', governorate: 'الشرقية' },
  'haddaq el qahira': { city: 'النزهة', governorate: 'القاهرة' },
  // الجيزة
  'sheikh zayed': { city: 'الشيخ زايد', governorate: 'الجيزة' },
  'sheikh zayed city': { city: 'الشيخ زايد', governorate: 'الجيزة' },
  '6th of october': { city: '6 أكتوبر', governorate: 'الجيزة' },
  '6 october': { city: '6 أكتوبر', governorate: 'الجيزة' },
  'october city': { city: '6 أكتوبر', governorate: 'الجيزة' },
  'hadayek october': { city: 'حدائق أكتوبر', governorate: 'الجيزة' },
  'haydak october': { city: 'حدائق أكتوبر', governorate: 'الجيزة' },
  'dokki': { city: 'الدقي', governorate: 'الجيزة' },
  'mohandessin': { city: 'المهندسين', governorate: 'الجيزة' },
  'mohandseen': { city: 'المهندسين', governorate: 'الجيزة' },
  'agouza': { city: 'العجوزة', governorate: 'الجيزة' },
  'el agouza': { city: 'العجوزة', governorate: 'الجيزة' },
  'haram': { city: 'الهرم', governorate: 'الجيزة' },
  'pyramids': { city: 'الهرم', governorate: 'الجيزة' },
  'imhaba': { city: 'إمبابة', governorate: 'الجيزة' },
  'embaba': { city: 'إمبابة', governorate: 'الجيزة' },
  'faisal giza': { city: 'فيصل', governorate: 'الجيزة' },
  'giza city': { city: 'الجيزة', governorate: 'الجيزة' },
  'talbia': { city: 'الطالبية', governorate: 'الجيزة' },
  // الإسكندرية
  'alexandria': { city: 'الإسكندرية', governorate: 'الإسكندرية' },
  'smoha': { city: 'سموحة', governorate: 'الإسكندرية' },
  'smouha': { city: 'سموحة', governorate: 'الإسكندرية' },
  'al ibrahimiyyah': { city: 'الإبراهيمية', governorate: 'الإسكندرية' },
  'ibrahimiya': { city: 'الإبراهيمية', governorate: 'الإسكندرية' },
  'sidi beshr': { city: 'سيدي بشر', governorate: 'الإسكندرية' },
  'sidi gaber': { city: 'سيدي جابر', governorate: 'الإسكندرية' },
  'sidi gabir': { city: 'سيدي جابر', governorate: 'الإسكندرية' },
  'cleopatra': { city: 'كليوباترا', governorate: 'الإسكندرية' },
  'shatby': { city: 'الشاطبي', governorate: 'الإسكندرية' },
  'glime': { city: 'فلمنج', governorate: 'الإسكندرية' },
  'raml station': { city: 'محطة الرمل', governorate: 'الإسكندرية' },
  'stanley': { city: 'سان ستيفانو', governorate: 'الإسكندرية' },
  'agami': { city: 'العجمي', governorate: 'الإسكندرية' },
  'muntazah': { city: 'المنتزه', governorate: 'الإسكندرية' },
  'mandara': { city: 'المندرة', governorate: 'الإسكندرية' },
  // مدن أخرى
  'sharm el-sheikh': { city: 'شرم الشيخ', governorate: 'جنوب سيناء' },
  'sharm al-sheikh': { city: 'شرم الشيخ', governorate: 'جنوب سيناء' },
  'sharm': { city: 'شرم الشيخ', governorate: 'جنوب سيناء' },
  'north coast': { city: 'الساحل الشمالي', governorate: 'مطروح' },
  'mashreg el arabia': { city: 'الساحل الشمالي', governorate: 'مطروح' },
} as const;

/** محافظات بالإنجليزية (addressRegion في OLX) → العربية الرسمية. */
const EN_GOVERNORATE_ALIASES: Readonly<Record<string, string>> = {
  cairo: 'القاهرة',
  giza: 'الجيزة',
  alexandria: 'الإسكندرية',
  sinai: 'جنوب سيناء',
  'south sinai': 'جنوب سيناء',
  matruh: 'مطروح',
  'red sea': 'البحر الأحمر',
  dakahlia: 'الدقهلية',
  sharqia: 'الشرقية',
  behira: 'البحيرة',
  'beheira': 'البحيرة',
  gharbia: 'الغربية',
  'kafr el-shikh': 'كفر الشيخ',
  monofia: 'المنوفية',
  qalyubia: 'القليوبية',
  'beni suef': 'بني سويف',
  fayoum: 'الفيوم',
  minya: 'المنيا',
  sohag: 'سوهاج',
  qena: 'قنا',
  luxor: 'الأقصر',
  aswan: 'أسوان',
  'new valley': 'الوادي الجديد',
  damietta: 'دمياط',
  'port said': 'بورسعيد',
  ismailia: 'الإسماعيلية',
  suez: 'السويس',
} as const;

function enAliasKey(text: string): string {
  return (text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function resolveEnPlace(city: string): { city: string; governorate: string } | null {
  const hit = SOURCE_EN_ALIASES[enAliasKey(city)];
  return hit ? { ...hit } : null;
}

function resolveEnGovernorate(governorate: string): string | null {
  return EN_GOVERNORATE_ALIASES[enAliasKey(governorate)] ?? null;
}

function slugifySearchText(text: string): string {
  return normalizeSearchText(text).replace(/\s+/g, '');
}

/** هل اسم الحي/المدينة موجود في أكثر من محافظة؟ (مثل «دار السلام» في القاهرة وسوهاج) */
export function placeNameIsAmbiguous(city: string): boolean {
  const norm = slugifySearchText(city);
  if (!norm) return false;
  const owners = EGYPT_GOVERNORATES.filter((g) =>
    g.places.some((p) => slugifySearchText(p.name) === norm)
  );
  return owners.length > 1;
}

/**
 * معرّف حي واحد وفريد: تطبيع اسم المدينة، مع لاحقة المحافظة عند التصادم.
 * المحافظة اختيارية — عند غيابها يُستخدم الاسم المجرّد (أفضل جهد للكراولر).
 */
export function neighborhoodKey(city: string, governorate?: string): string {
  const base = slugifySearchText(city) || slugifySearchText(FALLBACK_CITY);
  if (governorate && placeNameIsAmbiguous(city)) {
    return `${base}-${slugifySearchText(governorate)}`;
  }
  return base;
}

export interface DedupFields {
  neighborhoodId?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  areaM2?: number | null;
  price?: number | null;
}

/**
 * مفتاح بصمة التكرار: إعلانات مُعاد نشرها (نفس الوسيط يكرر نصّه برقم ID جديد)
 * تُحتسب مرة واحدة في الوسيط. يشترط تطابق الشقة (الحي+النوع+الغرف) ومساحتها
 * بدقة 10م² وسعرها بالضبط — حتى لا يمسّ دقيقين مختلفين في نفس الحي.
 */
export function listingDedupKey(f: DedupFields): string | null {
  if (!f.propertyType || !f.price) return null;
  const bed = f.bedrooms ? String(f.bedrooms) : 'na';
  const area = f.areaM2 ? String(Math.round(f.areaM2 / 10)) : 'na';
  return [f.neighborhoodId ?? 'na', f.propertyType, bed, area, f.price].join('|');
}

export interface ResolvedLocation {
  governorate: string;
  city: string;
  neighborhoodId: string;
  /** صحيح عندما طابق الاسم جدول الأحياء الرسمي فصُحّح اللفظ والمحافظة. */
  matched: boolean;
}

/**
 * يحوّل النص الخام (من الكراولر عادةً) إلى موقع رسمي صالح للتخزين:
 * يحاول مطابقة الاسم على جداول egypt-cities، وإن فشل يحتفظ بالنص الخام
 * كأفضل جهد (يُصحَّح تدريجيًا بالتدقيق اليدوي للأدمن).
 */
export function resolveListingLocation(
  city: string | null | undefined,
  governorate: string | null | undefined
): ResolvedLocation {
  const candidate = (city ?? '').trim();
  const m = candidate ? matchLocation([candidate]) : null;
  if (candidate && m?.city) {
    const gov = m.governorate ?? FALLBACK_CITY;
    // اسم عربي رسمي بالفعل (مع دعم اختصار «محافظة») — نثبّت المحافظة مع الترجمة إن وُجدت
    const resolvedGov = resolveEnGovernorate(governorate ?? '') ?? gov;
    return {
      matched: true,
      governorate: resolvedGov,
      city: m.city,
      neighborhoodId: neighborhoodKey(m.city, resolvedGov),
    };
  }
  // اسم إنجليزي (OLX/dubizzle) — ترجمة وقت الاستخراج إلى الرسم العربي.
  const en = candidate ? resolveEnPlace(candidate) : null;
  if (en) {
    const gov = resolveEnGovernorate(governorate ?? '') ?? en.governorate;
    return {
      matched: true,
      governorate: gov,
      city: en.city,
      neighborhoodId: neighborhoodKey(en.city, gov),
    };
  }
  const finalCity = candidate || FALLBACK_CITY;
  const finalGov = resolveEnGovernorate(governorate ?? '') ?? FALLBACK_CITY;
  return {
    matched: false,
    governorate: finalGov,
    city: finalCity,
    neighborhoodId: neighborhoodKey(finalCity, finalGov),
  };
}