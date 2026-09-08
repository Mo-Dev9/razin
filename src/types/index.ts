export interface Building {
  id: string;
  address: string;
  city: string;
  area: string;
  district?: string;
  governorate?: string;
  buildingNumber?: string;
  floor?: string;
  apartmentNumber?: string;
  geohash?: string;
  location?: { lat: number; lng: number };
  averageRatings: RatingAverages;
  reviewCount: number;
  lastReviewAt?: number;
  createdAt: number;
  source?: string;
}

export interface RatingAverages {
  zahma: number;
  humidity: number;
  landlord: number;
  neighbors: number;
  cleanliness: number;
  safety: number;
  services: number;
  annoyance: number;
  elevator: number;
  maintenance: number;
  ac: number;
  condition: number;
  overall: number;
}

export interface Review {
  id: string;
  buildingId: string;
  userId: string;
  ratings: ReviewRatings;
  overall: number;
  comment?: string;
  createdAt: number;
  buildingNumber?: string;
  floor?: string;
  apartmentNumber?: string;
  upvotes?: number;
  downvotes?: number;
}

export type VoteType = 'up' | 'down';

export const REPORT_REASONS = [
  { id: 'offensive', ar: 'محتوى مسيء' },
  { id: 'false_info', ar: 'معلومات غير حقيقية' },
  { id: 'promotion', ar: 'إعلان أو ترويج' },
  { id: 'personal_data', ar: 'بيانات شخصية' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['id'];

export interface ReportItem {
  id: string;
  reviewId: string;
  buildingId: string;
  reporterUid: string;
  reason: ReportReason;
  status: 'pending';
  createdAt: number;
}

export function isReportReason(value: unknown): value is ReportReason {
  return REPORT_REASONS.some((r) => r.id === value);
}

export interface ReviewRatings {
  zahma: number;
  humidity: number;
  landlord: number;
  neighbors: number;
  cleanliness: number;
  safety: number;
  services: number;
  annoyance: number;
  elevator: number;
  maintenance: number;
  ac: number;
  condition: number;
}

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

export const RATING_LABELS: Record<keyof ReviewRatings, { ar: string; icon: string }> = {
  zahma: { ar: 'الزحمة', icon: '🚗' },
  humidity: { ar: 'الرطوبة', icon: '💧' },
  landlord: { ar: 'تعاون المالك', icon: '🤝' },
  neighbors: { ar: 'الجيران', icon: '👥' },
  cleanliness: { ar: 'النظافة', icon: '🧹' },
  safety: { ar: 'الأمان', icon: '🛡️' },
  services: { ar: 'الخدمات', icon: '🏪' },
  annoyance: { ar: 'الإزعاج', icon: '🔊' },
  elevator: { ar: 'المصعد', icon: '🛗' },
  maintenance: { ar: 'الصيانة', icon: '🔧' },
  ac: { ar: 'التكيف', icon: '❄️' },
  condition: { ar: 'حالة الشقة', icon: '🏠' },
};
