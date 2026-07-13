// Shared axis-label formatting for time-series charts (Accounts, Investments).
// Beyond ~2 months, day-level labels ("13 Jul") are too dense to be useful — switch to
// one label per month ("Julho 2026") instead. Short ranges keep the exact day.
export const MONTH_YEAR_THRESHOLD_DAYS = 60;

export const formatDayMonth = (date, lang) => date.toLocaleDateString(lang, { day: '2-digit', month: 'short' });

export const formatMonthYear = (date, lang) => {
  const month = date.toLocaleDateString(lang, { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
};

export const formatChartDate = (date, lang, totalDays) =>
  totalDays > MONTH_YEAR_THRESHOLD_DAYS ? formatMonthYear(date, lang) : formatDayMonth(date, lang);
