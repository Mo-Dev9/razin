export interface Building {
  id: string;
  address: string;
  city: string;
  area: string;
  buildingNumber?: string;
  floor?: string;
  apartmentNumber?: string;
  geohash?: string;
  averageRatings: RatingAverages;
  reviewCount: number;
  lastReviewAt?: number;
  createdAt: number;
  source?: string;
}

export interface RatingAverages {
  noise: number;
  humidity: number;
  landlord: number;
  neighbors: number;
  lighting: number;
  safety: number;
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
}

export interface ReviewRatings {
  noise: number;
  humidity: number;
  landlord: number;
  neighbors: number;
  lighting: number;
  safety: number;
}

export interface Vote {
  id: string;
  reviewId: string;
  userId: string;
  type: 'up' | 'down';
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  displayName: string;
  email?: string;
  reviewCount: number;
  createdAt: number;
}

export const RATING_LABELS: Record<keyof ReviewRatings, { ar: string; icon: string }> = {
  noise: { ar: 'الضجيج', icon: '🔊' },
  humidity: { ar: 'الرطوبة', icon: '💧' },
  landlord: { ar: 'المالك', icon: '🏠' },
  neighbors: { ar: 'الجيران', icon: '👥' },
  lighting: { ar: 'الإنارة', icon: '💡' },
  safety: { ar: 'الأمان', icon: '🔒' },
};
