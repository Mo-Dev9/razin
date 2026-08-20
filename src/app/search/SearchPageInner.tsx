'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BuildingCard } from '@/components/building/BuildingCard';
import { useBuildings } from '@/hooks/useBuildings';
import type { Building } from '@/types';

export default function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  const { searchBuildings, loading } = useBuildings();
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Building[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (q) {
      searchBuildings(q).then((r) => {
        setResults(r);
        setSearched(true);
      });
    }
  }, [q, searchBuildings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--color-accent-dark)] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
          دليل الأحياء
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
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

      <form onSubmit={handleSearch} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 mb-6 shadow-soft">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
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
          <button
            type="submit"
            className="rounded-full bg-[var(--color-primary)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center justify-center gap-2"
          >
            ابحث
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2 pr-4">
          {searched ? `${results.length} نتيجة` : 'ابحث عن مبنى أو حي أو مدينة'}
        </p>
      </form>

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
        <div className="text-center py-20"><div className="w-10 h-10 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin mx-auto mb-4"></div><p className="text-sm text-[var(--color-text-secondary)]">جاري البحث...</p></div>
      ) : searched && results.length === 0 ? (
        <div className="bg-[var(--color-surface-warm)] border border-[var(--color-border)] rounded-3xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-dark)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-text)] mb-2">لم يتم العثور على نتائج</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">جرّب البحث باسم شارع أو حي مختلف.</p>
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
