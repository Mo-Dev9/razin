'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { neighborhoodSearchResults } from '@/lib/neighborhood-search';

interface NeighborhoodSearchProps {
  placeholder?: string;
  dark?: boolean;
  autoFocus?: boolean;
}

export function NeighborhoodSearch({ placeholder = 'ابحث عن حي أو مدينة...', dark = false, autoFocus = false }: NeighborhoodSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return neighborhoodSearchResults(q, 8);
  }, [query]);

  const go = (neighborhoodId: string) => {
    setOpen(false);
    setQuery('');
    setActive(-1);
    router.push(`/neighborhood/${encodeURIComponent(neighborhoodId)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[active >= 0 ? active : 0];
      if (target) go(target.neighborhoodId);
    }
  };

  const inputCls =
    'w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-4 ps-12 pe-12 text-base text-[var(--color-text)] placeholder-[var(--color-text-muted)] shadow-soft';
  const inputClsDark =
    'w-full rounded-2xl border border-white/15 bg-[#14383C] py-4 ps-12 pe-12 text-base text-[var(--color-text)] placeholder-[var(--color-text-muted)] shadow-lg';

  const activeCls = dark ? inputClsDark : inputCls;

  return (
    <div className="relative w-full" ref={boxRef}>
      <span aria-hidden className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={activeCls}
        aria-label="بحث عن حي أو مدينة"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="neighborhood-search-results"
        aria-autocomplete="list"
        autoComplete="off"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            setOpen(false);
          }}
          aria-label="مسح البحث"
          className="absolute end-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {open && query.trim() && (
        <div className="absolute start-0 end-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft">
          {results.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[var(--color-text-muted)]">
              لا نجد حيًا بهذا الاسم — جرّب اسم المنطقة أو المدينة.
            </p>
          ) : (
            <ul id="neighborhood-search-results" aria-label="نتائج البحث" role="listbox">
              {results.map((r, i) => (
                <li key={`${r.governorate}-${r.neighborhoodId}`} role="none">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(r.neighborhoodId)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors ${
                      i === active ? 'bg-[var(--color-surface-warm)]' : ''
                    }`}
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-[var(--color-text)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--color-text-muted)]" strokeWidth="2">
                        <path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {r.name}
                    </span>
                    <span className="rounded-full bg-[var(--color-surface-warm)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]">
                      {r.governorate}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}