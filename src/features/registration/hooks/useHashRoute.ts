import { useState, useEffect, useCallback } from 'react';

export function useHashRoute() {
  const [hash, setHash] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.location.hash || '';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((newHash: string) => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === newHash) return;
    window.location.hash = newHash;
    // Scroll to top smoothly when route changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isRegRoute = hash.startsWith('#/dang-ky');

  // Parse path & step query if present in hash, e.g. #/dang-ky?path=household&step=step-2
  const queryParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const pathParam = queryParams.get('path');
  const stepParam = queryParams.get('step');

  return {
    hash,
    isRegRoute,
    pathParam,
    stepParam,
    navigateTo,
  };
}
