'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const DEBOUNCE_MS = 1500;
const REPEAT_WINDOW_MS = 60_000;

export function VisitTracker() {
  const pathname = usePathname();
  const lastSentByPath = useRef<Map<string, number>>(new Map());
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    const now = Date.now();
    const lastSent = lastSentByPath.current.get(pathname) ?? 0;
    if (now - lastSent < REPEAT_WINDOW_MS) return;

    const send = () => {
      pending.current = null;
      lastSentByPath.current.set(pathname, Date.now());
      fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {});
    };

    pending.current = pathname;
    const timer = setTimeout(send, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      // Flush on navigation/cleanup so a fast page change isn't lost.
      if (pending.current) send();
    };
  }, [pathname]);

  return null;
}