'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BuildingCard } from '@/components/building/BuildingCard';
import { NumberGrid } from '@/components/ui/NumberGrid';
import { useBuildings } from '@/hooks/useBuildings';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { RATING_LABELS } from '@/types';
import type { Building, ReviewRatings } from '@/types';

type ActiveChip = 'all' | 'withReviews' | 'topRated';

function AddAndRateForm() {
  const router = useRouter();
  const { addBuilding, loading: buildingLoading } = useBuildings();
  const { submitReview, hasUserReviewed, loading: reviewLoading } = useReviews();
  const { user, loading: authLoading } = useAuth();

  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newArea, setNewArea] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [ratings, setRatings] = useState<ReviewRatings>({
    zahma: 3,
    humidity: 3,
    landlord: 3,
    neighbors: 3,
    cleanliness: 3,
    safety: 3,
    services: 3,
    annoyance: 3,
    elevator: 3,
    maintenance: 3,
    ac: 3,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const overall = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length;
  const keys = Object.keys(RATING_LABELS) as (keyof ReviewRatings)[];

  const handleSubmit = async () => {
    if (!newAddress.trim() || !newCity.trim() || !newArea.trim()) return;
    if (authLoading || !user) return;

    setSubmitting(true);
    setError('');

    try {
      const buildingId = await addBuilding({
        address: newAddress.trim(),
        city: newCity.trim(),
        area: newArea.trim(),
      });

      const already = await hasUserReviewed(buildingId, user.uid);
      if (already) {
        setError('لقد قيّمت هذا المبنى بالفعل.');
        setSubmitting(false);
        return;
      }

      const result = await submitReview(
        buildingId,
        ratings,
        comment || undefined,
        buildingNumber.trim() || undefined,
        floor.trim() || undefined,
        apartmentNumber.trim() || undefined
      );
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error || 'تم إضافة المبنى لكن فشل حفظ التقييم. حاول من صفحة المبنى.');
        if (!result.error) {
          setTimeout(() => router.push(`/building/${buildingId}`), 2000);
        }
      }
    } catch (err) {
      console.error('handleSubmit error:', err);
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. حاول مرة أخرى.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mx-auto mb-4" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">خلصتها!</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          أضفت المبنى وقيّمته بنجاح. تقييمك بقى جزء من دليل الحي.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.push('/search')}
            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-all"
          >
            اكتشف المباني
          </button>
          <button
            onClick={() => {
              setNewAddress('');
              setNewCity('');
              setNewArea('');
              setBuildingNumber('');
              setFloor('');
              setApartmentNumber('');
              setRatings({ zahma: 3, humidity: 3, landlord: 3, neighbors: 3, cleanliness: 3, safety: 3, services: 3, annoyance: 3, elevator: 3, maintenance: 3, ac: 3 });
              setComment('');
              setSubmitted(false);
            }}
            className="border border-[var(--color-border)] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[var(--color-surface-warm)] transition-all"
          >
            أضف مبنى ثاني
          </button>
        </div>
      </div>
    );
  }

  const loading = submitting || authLoading;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--color-accent-dark)] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
          أضف مبنى جديد
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
          أضف المبنى وقيّمه دلوقتي
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
          اكتب بيانات المبنى اللي ساكن فيه، ثم قيّمه على المعايير الحادية عشرة — كله في مكان واحد.
        </p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 mb-5">
        <label className="text-sm font-semibold text-[var(--color-text)] block mb-3">بيانات المبنى</label>
        <div className="space-y-3">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="عنوان المبنى (مثال: شارع مصطفى النحاس، مدينة نصر)"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] cursor-pointer"
            >
              <option value="">اختر المدينة</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="الإسكندرية">الإسكندرية</option>
              <option value="الدقهلية">الدقهلية</option>
              <option value="البحيرة">البحيرة</option>
              <option value="الشرقية">الشرقية</option>
              <option value="كفر الشيخ">كفر الشيخ</option>
              <option value="الغربية">الغربية</option>
              <option value="المنوفية">المنوفية</option>
              <option value="القليوبية">القليوبية</option>
              <option value="بني سويف">بني سويف</option>
              <option value="الفيوم">الفيوم</option>
              <option value="المنيا">المنيا</option>
              <option value="أسيوط">أسيوط</option>
              <option value="سوهاج">سوهاج</option>
              <option value="قنا">قنا</option>
              <option value="الأقصر">الأقصر</option>
              <option value="أسوان">أسوان</option>
              <option value="البحر الأحمر">البحر الأحمر</option>
              <option value="الوادي الجديد">الوادي الجديد</option>
              <option value="مطروح">مطروح</option>
              <option value="شمال سيناء">شمال سيناء</option>
              <option value="جنوب سيناء">جنوب سيناء</option>
              <option value="بورسعيد">بورسعيد</option>
              <option value="الإسماعيلية">الإسماعيلية</option>
              <option value="السويس">السويس</option>
              <option value="دمياط">دمياط</option>
            </select>
            <input
              type="text"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="الحي (مثال: مدينة نصر)"
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
              placeholder="رقم العمارة"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="الدور"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={apartmentNumber}
              onChange={(e) => setApartmentNumber(e.target.value)}
              placeholder="رقم الشقة"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 mb-5">
        <div className="mb-4">
          <p className="text-xs text-[var(--color-accent-dark)] font-medium mb-1">قيّم المبنى على المعايير الحادية عشرة</p>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">كيف كانت تجربتك في المبنى؟</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {keys.map((key) => (
            <NumberGrid
              key={key}
              label={RATING_LABELS[key].ar}
              icon={RATING_LABELS[key].icon}
              value={ratings[key]}
              onChange={(val) => setRatings({ ...ratings, [key]: val })}
            />
          ))}
        </div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-[var(--color-text)] block mb-2">تعليق اختياري</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="مثلاً: الشقة هادئة بعد الساعة 10، لكن مواقف تتلعب بسرعة..."
            maxLength={500}
            rows={3}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-[var(--color-text-muted)]">{comment.length}/500</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-[var(--color-surface-warm)]">
          <span className="text-[var(--color-accent)] text-lg">★</span>
          <div className="flex-1">
            <span className="text-sm font-bold text-[var(--color-text)]">{overall.toFixed(1)}</span>
            <span className="text-xs text-[var(--color-text-muted)] mr-2">من 5</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-sm ${star <= Math.round(overall) ? 'text-[var(--color-accent)]' : 'text-[var(--color-border)]'}`}>★</span>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !newAddress.trim() || !newCity.trim() || !newArea.trim()}
          className="w-full bg-[var(--color-primary)] text-white py-[16px] rounded-full text-sm font-bold hover:bg-[var(--color-primary-dark)] hover:shadow-[0_10px_25px_-5px_rgb(15_44_44/0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              أضف المبنى وقيّمه
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const addMode = searchParams.get('add') === 'true';
  const { searchBuildings, searchBuildingsAdvanced, getAllDistricts, loading } = useBuildings();
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Building[]>([]);
  const [searched, setSearched] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [activeChip, setActiveChip] = useState<ActiveChip>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    getAllDistricts().then(setDistricts);
  }, [getAllDistricts]);

  useEffect(() => {
    if (selectedCity) {
      getAllDistricts(selectedCity).then(setDistricts);
    } else {
      getAllDistricts().then(setDistricts);
    }
  }, [selectedCity, getAllDistricts]);

  useEffect(() => {
    if (q) {
      searchBuildings(q).then((r) => {
        setResults(r);
        setSearched(true);
      });
    }
  }, [q, searchBuildings]);

  const applyFilters = async (textQuery?: string, city?: string, district?: string, chip?: ActiveChip) => {
    const qText = textQuery ?? query;
    const c = city ?? selectedCity;
    const d = district ?? selectedDistrict;
    const ch = chip ?? activeChip;

    if (!qText.trim() && !c && !d && ch === 'all') {
      setResults([]);
      setSearched(false);
      return;
    }

    let filtered: Building[];

    if (qText.trim()) {
      filtered = await searchBuildings(qText.trim());
    } else {
      filtered = await searchBuildingsAdvanced({ city: c || undefined, district: d || undefined });
    }

    if (c) filtered = filtered.filter((b) => b.city === c);
    if (d) filtered = filtered.filter((b) => b.district === d);
    if (ch === 'withReviews') filtered = filtered.filter((b) => b.reviewCount > 0);
    if (ch === 'topRated') filtered = filtered.filter((b) => b.averageRatings.overall >= 4.0);

    setResults(filtered);
    setSearched(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict('');
    applyFilters(undefined, city, '');
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    applyFilters(undefined, undefined, district);
  };

  const handleChipClick = (chip: ActiveChip) => {
    setActiveChip(chip);
    applyFilters(undefined, undefined, undefined, chip);
  };

  const chipClass = (active: boolean) =>
    `flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium whitespace-nowrap border transition-all cursor-pointer ${
      active
        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
    }`;

  if (addMode) {
    return <AddAndRateForm />;
  }

  return (
    <>
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--color-accent-dark)] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
          دليل الأحياء
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
          المكان الذي تفكر فيه، تعرفه
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-2">
          ابحث بين تجارب السكان، وقارن تفاصيل المبنى كما عاشها كل يوم.
        </p>
        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          التقييمات مجهولة الهوية، وأنت اللي بتتحكم فيها
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 mb-5 shadow-soft">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اسم المبنى، الحي أو المدينة"
              className="w-full rounded-full bg-[var(--color-background)] border border-[var(--color-border-light)] py-3 pr-10 pl-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <button type="submit" className="rounded-2xl bg-[var(--color-primary)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--color-primary-dark)] hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            ابحث
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <select value={selectedCity} onChange={(e) => handleCityChange(e.target.value)} className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-3 py-2.5 text-sm text-[var(--color-text)] cursor-pointer">
            <option value="">كل المدن</option>
            <option value="القاهرة">القاهرة</option>
            <option value="الجيزة">الجيزة</option>
            <option value="الإسكندرية">الإسكندرية</option>
            <option value="الدقهلية">الدقهلية</option>
            <option value="البحيرة">البحيرة</option>
            <option value="الشرقية">الشرقية</option>
            <option value="كفر الشيخ">كفر الشيخ</option>
            <option value="الغربية">الغربية</option>
            <option value="المنوفية">المنوفية</option>
            <option value="القليوبية">القليوبية</option>
            <option value="بني سويف">بني سويف</option>
            <option value="الفيوم">الفيوم</option>
            <option value="المنيا">المنيا</option>
            <option value="أسيوط">أسيوط</option>
            <option value="سوهاج">سوهاج</option>
            <option value="قنا">قنا</option>
            <option value="الأقصر">الأقصر</option>
            <option value="أسوان">أسوان</option>
            <option value="البحر الأحمر">البحر الأحمر</option>
            <option value="الوادي الجديد">الوادي الجديد</option>
            <option value="مطروح">مطروح</option>
            <option value="شمال سيناء">شمال سيناء</option>
            <option value="جنوب سيناء">جنوب سيناء</option>
            <option value="بورسعيد">بورسعيد</option>
            <option value="الإسماعيلية">الإسماعيلية</option>
            <option value="السويس">السويس</option>
            <option value="دمياط">دمياط</option>
          </select>
          <select value={selectedDistrict} onChange={(e) => handleDistrictChange(e.target.value)} className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-3 py-2.5 text-sm text-[var(--color-text)] cursor-pointer">
            <option value="">كل الأحياء</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <p className="text-[10px] text-[var(--color-text-muted)] mt-2 pr-4">
          {searched ? `${results.length} نتيجة` : 'ابحث عن مبنى أو حي أو مدينة'}
        </p>
      </form>

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <button onClick={() => handleChipClick('all')} className={chipClass(activeChip === 'all')}>
          <span>📊</span>
          بيانات الحي
        </button>
        <button onClick={() => handleChipClick('withReviews')} className={chipClass(activeChip === 'withReviews')}>
          <span>💬</span>
          تقييمات السكان
        </button>
        <button onClick={() => handleChipClick('topRated')} className={chipClass(activeChip === 'topRated')}>
          <span>⚖️</span>
          الأعلى تقييماً
        </button>
      </div>

      {searched && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-[var(--color-accent-dark)] font-medium">كل المباني</span>
            <span className="text-sm font-bold text-[var(--color-text)] mr-2">{results.length} مبنى</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            مرتبة حسب الأحدث
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-[var(--color-text-secondary)]">جاري البحث...</p>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="bg-[var(--color-surface-warm)] border border-[var(--color-border)] rounded-3xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E9B94A" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-text)] mb-2">لم يتم العثور على نتائج</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">جرّب البحث باسم شارع أو حي مختلف.</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[var(--color-accent)] text-[var(--color-primary)] px-6 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)] hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
            >
              + أضف المبنى وقيّمه
            </button>
            <button
              onClick={() => { setQuery(''); setResults([]); setSearched(false); setSelectedCity(''); setSelectedDistrict(''); setActiveChip('all'); }}
              className="text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-primary)] transition-colors"
            >
              حاول مجدداً
            </button>
          </div>
        </div>
      ) : !searched ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold mb-2">ابدأ البحث</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            اكتب عنوان المبنى أو اسم الحي عشان تشوف التقييمات
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[var(--color-accent)] text-[var(--color-primary)] px-6 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)] hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
          >
            مبنى مش موجود؟ أضفه وقيّمه
          </button>
        </div>
      ) : (
        <div className="space-y-3 pb-10">
          {results.map((building) => (
            <BuildingCard key={building.id} building={building} />
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAddForm(false)}>
          <div
            className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-background)] sm:rounded-3xl rounded-t-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--color-text)]">أضف مبنى جديد</h2>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <AddAndRateForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
