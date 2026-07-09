import { describe, it, expect } from 'vitest';
import { convertBudgetAmount } from '../budgetProration';

describe('convertBudgetAmount', () => {
  it('returns the same amount when converting to the same period', () => {
    expect(convertBudgetAmount(1000, 'monthly', 'monthly')).toBeCloseTo(1000);
  });

  it('converts monthly to daily/weekly/biweekly using the 30-day-month convention', () => {
    // Matches BudgetConsumptionChart's totalPeriodBudget switch exactly.
    expect(convertBudgetAmount(3000, 'monthly', 'daily')).toBeCloseTo(3000 / 30);
    expect(convertBudgetAmount(3000, 'monthly', 'weekly')).toBeCloseTo((3000 / 30) * 7);
    expect(convertBudgetAmount(3000, 'monthly', 'biweekly')).toBeCloseTo(3000 / 2);
  });

  it('converts monthly to quarterly/semiannual/yearly using the 30-day-month convention', () => {
    expect(convertBudgetAmount(1000, 'monthly', 'quarterly')).toBeCloseTo(1000 * 3);
    expect(convertBudgetAmount(1000, 'monthly', 'semiannual')).toBeCloseTo(1000 * 6);
    expect(convertBudgetAmount(1000, 'monthly', 'yearly')).toBeCloseTo(1000 * 12);
  });

  it('round-trips: converting A -> B -> A returns the original amount', () => {
    const amount = 350;
    const converted = convertBudgetAmount(amount, 'weekly', 'yearly');
    const back = convertBudgetAmount(converted, 'yearly', 'weekly');
    expect(back).toBeCloseTo(amount);
  });

  it('converts a non-monthly source period correctly (e.g. weekly -> daily)', () => {
    // 70/week -> should be 10/day (70/7)
    expect(convertBudgetAmount(70, 'weekly', 'daily')).toBeCloseTo(10);
  });

  it('returns 0 for a missing/zero amount or an unknown period', () => {
    expect(convertBudgetAmount(0, 'monthly', 'daily')).toBe(0);
    expect(convertBudgetAmount(null, 'monthly', 'daily')).toBe(0);
    expect(convertBudgetAmount(100, 'bogus', 'daily')).toBe(0);
    expect(convertBudgetAmount(100, 'monthly', 'bogus')).toBe(0);
  });
});
