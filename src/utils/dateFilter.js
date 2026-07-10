// Shared date-filter model used by the Transactions and Invoices pages.
// filter.type is one of: '' (all), 'last_week', 'last_month', 'last_year',
// 'month' (filter.month/filter.year), 'year' (filter.year), 'period' (filter.startDate/filter.endDate).

const toISODate = (date) => date.toISOString().split('T')[0];

export const getDateFilterDefaults = () => {
  const now = new Date();
  return {
    type: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    startDate: '',
    endDate: '',
  };
};

export const isDateFilterActive = (filter) => !!filter?.type;

// Resolves a filter into a concrete [startDate, endDate] Date range, for
// callers that need actual bounds (e.g. a chart x-axis) rather than a
// per-item predicate. `fallbackStartDate` is used for open-ended cases
// ('all', or a 'month'/'year'/'period' filter missing its bound).
export const getDateFilterRange = (filter, fallbackStartDate) => {
  const now = new Date();
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const fallbackStart = fallbackStartDate ?? now;

  switch (filter?.type) {
    case 'last_week': {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return { startDate: start, endDate: now };
    }
    case 'last_month': {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
      return { startDate: prevMonth, endDate: endOfDay(end) };
    }
    case 'last_year': {
      const year = now.getFullYear() - 1;
      return { startDate: new Date(year, 0, 1), endDate: endOfDay(new Date(year, 11, 31)) };
    }
    case 'month': {
      if (!filter.month || !filter.year) return { startDate: fallbackStart, endDate: now };
      const start = new Date(filter.year, filter.month - 1, 1);
      const end = new Date(filter.year, filter.month, 0);
      return { startDate: start, endDate: endOfDay(end) };
    }
    case 'year': {
      if (!filter.year) return { startDate: fallbackStart, endDate: now };
      return { startDate: new Date(filter.year, 0, 1), endDate: endOfDay(new Date(filter.year, 11, 31)) };
    }
    case 'period': {
      const start = filter.startDate ? new Date(`${filter.startDate}T00:00:00`) : fallbackStart;
      const end = filter.endDate ? new Date(`${filter.endDate}T23:59:59`) : now;
      return { startDate: start, endDate: end };
    }
    default:
      return { startDate: fallbackStart, endDate: now };
  }
};

export const matchesDateFilter = (dateStr, filter) => {
  if (!filter || !filter.type) return true;
  if (!dateStr) return false;

  const now = new Date();

  switch (filter.type) {
    case 'last_week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return dateStr >= toISODate(weekAgo) && dateStr <= toISODate(now);
    }
    case 'last_month': {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prefix = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
      return dateStr.startsWith(prefix);
    }
    case 'last_year': {
      return dateStr.startsWith(String(now.getFullYear() - 1));
    }
    case 'month': {
      if (!filter.month || !filter.year) return true;
      const prefix = `${filter.year}-${String(filter.month).padStart(2, '0')}`;
      return dateStr.startsWith(prefix);
    }
    case 'year': {
      if (!filter.year) return true;
      return dateStr.startsWith(String(filter.year));
    }
    case 'period': {
      if (filter.startDate && dateStr < filter.startDate) return false;
      if (filter.endDate && dateStr > filter.endDate) return false;
      return true;
    }
    default:
      return true;
  }
};
