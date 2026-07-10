import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// In-memory only: this SPA has no ScrollRestoration (plain BrowserRouter), so every
// route unmount/remount (e.g. clicking a different sidebar link and back) resets
// window scroll to the top. Keyed by pathname so each page remembers its own position.
const scrollPositions = new Map();

export const useScrollRestoration = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const saved = scrollPositions.get(pathname);
    window.scrollTo(0, saved ?? 0);
  }, [pathname]);

  useEffect(() => {
    // Tracked live (not just on unmount) so the saved value is correct regardless
    // of exact effect-cleanup ordering when swapping to another route.
    const handleScroll = () => scrollPositions.set(pathname, window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
};

export default useScrollRestoration;
