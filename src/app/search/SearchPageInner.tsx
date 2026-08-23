'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BuildingCard } from '@/components/building/BuildingCard';
import { useBuildings } from '@/hooks/useBuildings';
import type { Building } from '@/types';

type ActiveChip = 'all' | 'withReviews' | 'topRated';

export default function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const addMode = searchParams.get('add') === 'true';
  const { searchBuildings, searchBuildingsAdvanced, getAllCities, getAllDistricts, addBuilding, loading } = useBuildings();
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Building[]>([]);
  const [searched, setSearched] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [activeChip, setActiveChip] = useState<ActiveChip>('all');
  const [showAddForm, setShowAddForm] = useState(addMode);
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newArea, setNewArea] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    getAllCities().then(setCities);
    getAllDistricts().then(setDistricts);
  }, [getAllCities, getAllDistricts]);

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

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || !newCity.trim() || !newArea.trim()) return;
    setAddLoading(true);
    const id = await addBuilding({
      address: newAddress.trim(),
      city: newCity.trim(),
      area: newArea.trim(),
    });
    setAddLoading(false);
    if (id) {
      router.push(`/rate/${id}`);
    }
  };

  const chipClass = (active: boolean) =>
    `flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium whitespace-nowrap border transition-all cursor-pointer ${
      active
        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
    }`;

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
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
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

          {!showAddForm ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-[var(--color-accent)] text-[var(--color-primary)] px-6 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)] hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
              >
                + أضف مبناك
              </button>
              <button
                onClick={() => { setQuery(''); setResults([]); setSearched(false); setSelectedCity(''); setSelectedDistrict(''); setActiveChip('all'); }}
                className="text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-primary)] transition-colors"
              >
                حاول مجدداً
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddBuilding} className="max-w-sm mx-auto text-right">
              <h4 className="font-semibold text-[var(--color-text)] mb-3">أضف مبناك</h4>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">أضف المبنى الأول وتقيّمه أنت</p>

              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="عنوان المبنى (مثال: شارع مصطفى النحاس)"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-3"
              />

              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="المدينة (مثال: القاهرة)"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-3"
              />

              <input
                type="text"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="الحي (مثال: مدينة نصر)"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-4"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addLoading || !newAddress.trim() || !newCity.trim() || !newArea.trim()}
                  className="flex-1 bg-[var(--color-primary)] text-white px-4 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-primary-dark)] hover:scale-105 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? 'جاري الإضافة...' : 'أضف وقيّم'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewAddress(''); setNewCity(''); setNewArea(''); }}
                  className="px-4 py-3 rounded-full text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      ) : !searched ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold mb-2">ابدأ البحث</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            اكتب عنوان المبنى أو اسم الحي عشان تشوف التقييمات
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-10">
          {results.map((building) => (
            <BuildingCard key={building.id} building={building} />
          ))}
        </div>
      )}
    </>
  );
}
