export interface Building {
  id: string;
  address: string;
  city: string;
  area: string;
  district?: string;
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

export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  displayName: string;
  email?: string;
  reviewCount: number;
  createdAt: number;
}

export const RATING_LABELS: Record<keyof ReviewRatings, { ar: string; icon: string }> = {
  noise: { ar: 'الطرقبة', icon: '🚗' },
  humidity: { ar: 'الهدوء', icon: '🤫' },
  landlord: { ar: 'تعاون المالك', icon: '🤝' },
  neighbors: { ar: 'الجيران', icon: '👥' },
  safety: { ar: 'الأمان', icon: '🛡️' },
  lighting: { ar: 'الإضاءة', icon: '💡' },
};
