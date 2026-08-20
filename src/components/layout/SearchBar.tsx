'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
}

export function SearchBar({ initialQuery = '', placeholder = 'اسم المبنى، الحي أو المدينة' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] py-3 pr-10 pl-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
      </div>
      <button
        type="submit"
        className="rounded-2xl bg-[var(--color-primary)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--color-primary-dark)] hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transition-all flex-shrink-0"
      >
        ابحث
      </button>
    </form>
  );
}
