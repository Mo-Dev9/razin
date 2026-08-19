'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { useAuth } from '@/hooks/useAuth';
import { useBuildings } from '@/hooks/useBuildings';
import { useReviews } from '@/hooks/useReviews';
import { RATING_LABELS } from '@/types';
import type { Building, ReviewRatings } from '@/types';

interface RatePageInnerProps {
  buildingId: string;
}

export default function RatePageInner({ buildingId }: RatePageInnerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { getBuilding } = useBuildings();
  const { submitReview, hasUserReviewed, loading } = useReviews();

  const [building, setBuilding] = useState<Building | null>(null);
  const [ratings, setRatings] = useState<ReviewRatings>({
    noise: 3,
    humidity: 3,
    landlord: 3,
    neighbors: 3,
    lighting: 3,
    safety: 3,
  });
  const [comment, setComment] = useState('');
  const [floor, setFloor] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (buildingId) {
      getBuilding(buildingId).then(setBuilding);
    }
  }, [buildingId, getBuilding]);

  useEffect(() => {
    if (buildingId && user) {
      hasUserReviewed(buildingId, user.uid).then(setAlreadyReviewed);
    }
  }, [buildingId, user, hasUserReviewed]);

  const overall = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length;

  const handleSubmit = async () => {
    if (!user) return;
    const ok = await submitReview(buildingId, user.uid, ratings, comment || undefined, floor || undefined, apartmentNumber || undefined);
    if (ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">شكراً لتقييمك!</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              تقييمك هيساعد المستأجرين اللي جايين
            </p>
            <Button onClick={() => router.push(`/building/${buildingId}`)}>
              رجوع للمبنى
            </Button>
          </div>
        </main>
      </>
    );
  }

  if (alreadyReviewed) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold mb-2">لقد قيّمت هذا المبنى بالفعل</h2>
            <Button variant="ghost" onClick={() => router.back()}>رجوع</Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        {building && (
          <div className="mb-6">
            <h1 className="text-lg font-bold">{building.address}</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {building.area}، {building.city}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">الدور</label>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="مثال: 3"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">رقم الشقة</label>
            <input
              type="text"
              value={apartmentNumber}
              onChange={(e) => setApartmentNumber(e.target.value)}
              placeholder="مثال: 12"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">التقييم العام</span>
            <span className="text-2xl font-bold text-[var(--color-primary)]">
              {overall.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {Object.entries(RATING_LABELS).map(([key, { ar, icon }]) => (
            <Slider
              key={key}
              label={ar}
              icon={icon}
              value={ratings[key as keyof ReviewRatings]}
              onChange={(val) => setRatings({ ...ratings, [key]: val })}
            />
          ))}
        </div>

        <div className="mb-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="تعليق اختياري..."
            maxLength={500}
            rows={3}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] resize-none"
          />
          <div className="text-[10px] text-[var(--color-text-secondary)] text-left mt-1">
            {comment.length}/500
          </div>
        </div>

        <Button className="w-full" loading={loading} onClick={handleSubmit}>
          إرسال التقييم
        </Button>
      </main>
      <Footer />
    </>
  );
}
