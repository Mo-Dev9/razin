/**
 * أنواع حزمة الكراولر (src/lib/crawler).
 *
 * قراران ثابتان من STUDY.md §5.3/§5.4:
 * - مصدر الأسعار الوحيد = الإعلانات العامة المنشورة («إعلانات السوق فقط»).
 * - لا تجاوز حماية تقنية إطلاقًا: الصفحة المحمية تُحفظ في collectionQueue للجمع اليدوي.
 */

export interface CrawlSource {
  id: string;
  name: string;
  /** أساس النطاق قبل أي مسار (مثل https://www.olx.com.eg). */
  baseUrl: string;
  /** عنوان ملف robots.txt التابع للمصدر. */
  robotsUrl: string;
  /** مسار (pathname) واحد أدنى يُسمح للكراولر بزيارته — يُضاف للفحص الاحترازي. */
  allowedPathPrefixes: string[];
}

export interface CrawlSettings {
  /** تعرّف وكيل صريح وغير مضلل (اسم المنتج + رقم الإصدار + غرض). */
  userAgent: string;
  /** مهلة الطلب الواحد بالمللي ثانية. */
  timeoutMs: number;
  /** مهلة إضافية اختيارية مريحة بين الطلبات (بالمللي ثانية). */
  minDelayMs?: number;
}

/** إعلان واحد مُستخرج ومُطبَّع. الحقول التي لا يوفّرها المصدر تبقى null. */
export interface ParsedListing {
  externalId: string;
  title: string;
  url: string;
  price: number;
  currency: string;
  /** اسم الحي/المدينة كما كتبه البائع (خام، غير مُخترَع). */
  city: string | null;
  /** إقليم/محافظة كما ذكره المصدر (خام). */
  governorate: string | null;
  /** معرف نوع العقار من PROPERTY_TYPES إن أمكن ربطه، وإلا null. */
  propertyType: string | null;
  /** معرف التشطيب من FINISHING_LEVELS إن أمكن ربطه، وإلا null. */
  finishing: string | null;
  rooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  rentalFrequency: 'monthly' | 'daily' | 'yearly' | null;
  /** زمن نشر الإعلان إن وجده المصدر (epoch ms)، وإلا null. */
  listedAt: number | null;
  sourceUrl: string;
}

export type BlockReason = 'login' | 'captcha' | 'protected' | 'robots-disallow' | 'blocked'; 

/** صفحة رفض الكراولر الوصول إليها — يُحفظ عنوانها للجمع اليدوي الطبيعي. */
export interface BlockedPage {
  url: string;
  reason: BlockReason;
  note?: string;
}

export interface CrawlResult {
  sourceId: string;
  /** عدد الصفحات التي نُفّذ عليها الطلب فعليًا. */
  fetchedPages: number;
  /** إجمالي الإعلانات المتاحة حسب إشارة المصدر (قد لا يكون موجودًا). */
  totalAvailable: number | null;
  parsed: ParsedListing[];
  blocked: BlockedPage[];
  error: string | null;
}