import '@testing-library/jest-dom';
import '@/i18n';

// ─── localStorage shim ────────────────────────────────────────────────────────
// Node 26 exposes an experimental but undefined localStorage global that
// shadows jsdom's working implementation.
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store = {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem:  (k)    => store[k] ?? null,
      setItem:  (k, v) => { store[k] = String(v); },
      removeItem:(k)   => { delete store[k]; },
      clear:    ()     => { Object.keys(store).forEach(k => delete store[k]); },
    },
    writable: true,
  });
}

// ─── ResizeObserver stub ──────────────────────────────────────────────────────
// recharts' ResponsiveContainer uses ResizeObserver; jsdom does not provide it.
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe()   {}
    unobserve() {}
    disconnect(){}
  };
}

// ─── matchMedia stub ──────────────────────────────────────────────────────────
// Used by several Radix UI components; jsdom does not provide it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener:    () => {},
      removeListener: () => {},
      addEventListener:    () => {},
      removeEventListener: () => {},
      dispatchEvent:  () => false,
    }),
  });
}
