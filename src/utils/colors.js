// Single source of truth for semantic colors.
// CSS variables in index.css hold the same values for Tailwind utilities.
// Use these constants anywhere a hex string is required (Recharts, SVG attributes, inline styles).

// Brand
export const PRIMARY   = '#43CFEA';
export const PRIMARY_HOVER = '#2BA8C4';

// Semantic — light mode
export const SUCCESS   = '#10b981';
export const DANGER    = '#f87171'; // Tailwind red-400
export const WARNING   = '#eab308';
export const INFO      = '#3b82f6';

// Tailwind text class strings for semantic states (use in className props).
// Fixed single shades rather than `dark:` CSS-var overrides — those CSS vars
// (--destructive etc.) don't resolve to these same SUCCESS/WARNING/DANGER hexes,
// so a `dark:` swap made the text a visibly different color than the chart lines
// right next to it. One shade per semantic color, same in both themes.
export const TEXT_SUCCESS = 'text-emerald-500'; // matches SUCCESS
export const TEXT_WARNING = 'text-yellow-500'; // matches WARNING
export const TEXT_DANGER  = 'text-red-400'; // matches DANGER
export const TEXT_PRIMARY = 'text-primary';
export const TEXT_NEUTRAL = 'text-gray-900 dark:text-vindex-text';

// Semantic — dark mode overrides
export const DANGER_DARK = '#e3365e';

// Chart helpers — grid, tooltip, axis labels adapt to dark/light
// Grid lines are meant to be a faint reference, not a visible pattern — keep them
// close to the card's own border color rather than a stronger gray that competes
// with the data lines.
export const chartGrid        = (isDark) => isDark ? '#1e293b' : '#f1f5f9';
export const chartTooltipBg   = (isDark) => isDark ? '#0b122d' : '#ffffff';
export const chartTooltipBorder = (isDark) => isDark ? '#283768' : '#e2e8f0';
// Matches the app's own --muted-foreground token (a blue-tinted slate) rather
// than Tailwind's flat neutral gray, so axis labels read as part of the same
// theme instead of a slightly-off gray pasted on top.
export const chartText        = (isDark) => isDark ? '#94a3b8' : '#64748b';
export const chartCursor      = (isDark) => isDark ? '#374151' : '#f3f4f6';

// Rgba helpers for activeDot glow
export const successAlpha = (opacity) => `rgba(16, 185, 129, ${opacity})`;
export const dangerAlpha  = (opacity) => `rgba(248, 113, 113, ${opacity})`;
export const infoAlpha    = (opacity) => `rgba(59, 130, 246, ${opacity})`;
export const primaryAlpha = (opacity) => `rgba(67, 207, 234, ${opacity})`;
