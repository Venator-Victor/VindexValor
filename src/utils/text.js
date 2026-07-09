// Accent-insensitive, case-insensitive normalization for free-text search
// (icon search, category search, etc.).
export const normalizeText = (str) =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
