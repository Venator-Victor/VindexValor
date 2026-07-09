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
