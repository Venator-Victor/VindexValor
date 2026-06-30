// Single source of truth for semantic colors.
// CSS variables in index.css hold the same values for Tailwind utilities.
// Use these constants anywhere a hex string is required (Recharts, SVG attributes, inline styles).

// Brand
export const PRIMARY   = '#43CFEA';
export const PRIMARY_HOVER = '#2BA8C4';

// Semantic — light mode
export const SUCCESS   = '#10b981';
export const DANGER    = '#ef4444';
export const WARNING   = '#eab308';
export const INFO      = '#3b82f6';

// Tailwind text class strings for semantic states (use in className props)
export const TEXT_SUCCESS = 'text-green-600 dark:text-vindex-success';
export const TEXT_WARNING = 'text-yellow-500 dark:text-vindex-warning';
export const TEXT_DANGER  = 'text-red-600 dark:text-vindex-danger';
export const TEXT_PRIMARY = 'text-primary';
export const TEXT_NEUTRAL = 'text-gray-900 dark:text-vindex-text';

// Semantic — dark mode overrides
export const DANGER_DARK = '#e3365e';

// Chart helpers — grid, tooltip, axis labels adapt to dark/light
export const chartGrid        = (isDark) => isDark ? '#374151' : '#e5e7eb';
export const chartTooltipBg   = (isDark) => isDark ? '#0b122d' : '#ffffff';
export const chartTooltipBorder = (isDark) => isDark ? '#283768' : '#e2e8f0';
export const chartText        = (isDark) => isDark ? '#9ca3af' : '#6b7280';
export const chartCursor      = (isDark) => isDark ? '#374151' : '#f3f4f6';

// Rgba helpers for activeDot glow
export const successAlpha = (opacity) => `rgba(16, 185, 129, ${opacity})`;
export const dangerAlpha  = (opacity) => `rgba(239, 68, 68, ${opacity})`;
export const infoAlpha    = (opacity) => `rgba(59, 130, 246, ${opacity})`;
export const primaryAlpha = (opacity) => `rgba(67, 207, 234, ${opacity})`;
