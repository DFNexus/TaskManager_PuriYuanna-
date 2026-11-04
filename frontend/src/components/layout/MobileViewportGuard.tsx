'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Prevents mobile browsers from carrying over input-focus zoom
 * or auto-focusing text fields during client-side route transitions.
 */
export default function MobileViewportGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobileOrCoarse = window.matchMedia('(pointer: coarse), (max-width: 767px)').matches;
    if (!isMobileOrCoarse) return;

    const active = document.activeElement;
    if (
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement
    ) {
      active.blur();
    }
  }, [pathname]);

  return null;
}

