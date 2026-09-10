export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  displayName: string;
  email?: string;
  photoURL?: string;
  linkedProvider?: string;
  linkedAt?: number;
  reviewCount: number;
  createdAt: number;
}

export type PropertyType =
  | 'apartment'
  | 'studio'
  | 'penthouse'
  | 'duplex'
  | 'roof'
  | 'villa'
  | 'townhouse'
  | 'chalet'
  | 'shop'
  | 'office';

export const PROPERTY_TYPES: ReadonlyArray<{ id: PropertyType; ar: string }> = [
  { id: 'apartment', ar: 'شقة' },
  { id: 'studio', ar: 'استوديو' },
  { id: 'penthouse', ar: 'بنتهاوس' },
  { id: 'duplex', ar: 'دوبلكس' },
  { id: 'roof', ar: 'روف' },
  { id: 'villa', ar: 'فيلا' },
  { id: 'townhouse', ar: 'تاون هاوس' },
  { id: 'chalet', ar: 'شاليه' },
  { id: 'shop', ar: 'محل' },
  { id: 'office', ar: 'مكتب' },
];

export type FinishingLevel = 'basic' | 'average' | 'lux' | 'super-lux';

export const FINISHING_LEVELS: ReadonlyArray<{ id: FinishingLevel; ar: string }> = [
  { id: 'basic', ar: 'ساده' },
  { id: 'average', ar: 'متوسط' },
  { id: 'lux', ar: 'لوكس' },
  { id: 'super-lux', ar: 'سوبر لوكس' },
];

export type ListingSourceType = 'manual' | 'crawled';

export type VerificationStatus = 'verified' | 'unverified';

export type ListingStatus = 'active' | 'removed';

/**
 * سجل سعر واحد = إعلان واحد من السوق. كل حقل يطابق نموذج §5.2 في STUDY.md.
 * neighborhoodId هو مفتاح الحي المطبيع (انظر src/lib/listing-utils.ts).
 */
export interface Listing {
  id: string;
  governorate: string;
  city: string;
  neighborhoodId: string;
  propertyType: PropertyType;
  rooms: number;
  bathrooms: number;
  finishing: FinishingLevel;
  price: number;
  sourceName: string;
  sourceType: ListingSourceType;
  sourceUrl?: string;
  verif: VerificationStatus;
  listedAt?: number;
  recordedAt: number;
  status: ListingStatus;
  note?: string;
}

export type QuestionStatus = 'open' | 'resolved';

export interface QuestionReply {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
}

export interface Question {
  id: string;
  governorate: string;
  city: string;
  neighborhoodId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
  numReplies: number;
  status: QuestionStatus;
}

export type CollectionQueueReason = 'login' | 'captcha' | 'protected' | 'robots-disallow';

export type CollectionQueueStatus = 'pending' | 'collected' | 'skipped';

/**
 * الصفحة المحمية التي سجّلها الكراولر، بانتظار جمعها يدويًا (تسجيل دخول طبيعي +
 * إدخال يدوي). قرار §5.4: لا تجاوز حماية تقنية إطلاقًا.
 */
export interface CollectionQueueItem {
  id: string;
  url: string;
  sourceName: string;
  reason: CollectionQueueReason;
  status: CollectionQueueStatus;
  addedAt: number;
  collectedAt?: number;
  note?: string;
}