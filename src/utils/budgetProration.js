// Converts a budget amount from one period to another, via a monthly-equivalent
// bridge. Approximations (30-day month, 15-day biweekly) match the ones already
// used in BudgetConsumptionChart's totalPeriodBudget calculation, so a category's
// prorated breakdown lines up with the app's other budget math.
const MONTHLY_EQUIVALENT_FACTOR = {
  daily: 30,
  weekly: 30 / 7,
  biweekly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  yearly: 1 / 12,
};

export const convertBudgetAmount = (amount, fromPeriod, toPeriod) => {
  const from = MONTHLY_EQUIVALENT_FACTOR[fromPeriod];
  const to = MONTHLY_EQUIVALENT_FACTOR[toPeriod];
  if (!amount || !from || !to) return 0;
  const monthlyEquivalent = amount * from;
  return monthlyEquivalent / to;
};
