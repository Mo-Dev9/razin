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
  furnished?: boolean;
  subArea?: string;
  rentalFrequency?: 'monthly' | 'daily' | 'weekly' | 'yearly' | 'unknown';
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
  lat?: number;
  lng?: number;
  area?: string;
}

/** تسمية قرب منشور «حارة» عن المستخدم — لا تُكشف إحداثيات، فقط فئة نصية. */
export type ProximityKind = 'here' | 'veryClose' | 'close' | 'far' | 'unknown';

export type PostStatus = 'open' | 'hidden';

/** مستند منشور «حارة» كما يُخزَّن في Firestore (posts/{id}). */
export interface CommunityPostDoc {
  id: string;
  city: string | null;
  governorate: string | null;
  neighborhoodId: string | null;
  area: string | null;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
  upCount: number;
  downCount: number;
  netVotes: number;
  numComments: number;
  status: PostStatus;
  lat: number | null;
  lng: number | null;
  cell: string | null;
  /** منشور إرشادي من فريق رزين — يُعرض مهما كان موقعك/حيّك، وقابل للإخفاء من المستخدم. */
  isGuide?: boolean;
  /** منشور بلّغ عنه مستخدم واحد على الأقل (لا يُخفى فورًا — يُخفى عند تكرار الإبلاغ). */
  reported?: boolean;
}

export interface PostComment {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
}

export interface PostReport {
  id: string;
  userId: string;
  text: string | null;
  createdAt: number;
}

/** منشور «حارة» كما يصل للواجهة — بلا إحداثيات ولا هوية، فقط تسمية القرب. */
export interface PostView {
  id: string;
  text: string;
  displayName: string;
  createdAt: number;
  upCount: number;
  downCount: number;
  netVotes: number;
  numComments: number;
  city: string | null;
  neighborhoodId: string | null;
  kind: ProximityKind;
  badgeLabel: string | null;
  myVote: -1 | 0 | 1;
  isGuide: boolean;
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