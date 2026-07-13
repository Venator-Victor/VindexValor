import { describe, it, expect } from 'vitest';
import { matchesDateFilter, isDateFilterActive, getDateFilterDefaults } from '../dateFilter';

describe('getDateFilterDefaults', () => {
  it('defaults to no active filter, current month/year', () => {
    const defaults = getDateFilterDefaults();
    expect(defaults.type).toBe('');
    expect(defaults.month).toBe(new Date().getMonth() + 1);
    expect(defaults.year).toBe(new Date().getFullYear());
  });
});

describe('isDateFilterActive', () => {
  it('is false for the "all" (empty type) filter', () => {
    expect(isDateFilterActive({ type: '' })).toBe(false);
  });

  it('is true for any other type', () => {
    expect(isDateFilterActive({ type: 'last_week' })).toBe(true);
  });
});

describe('matchesDateFilter', () => {
  it('matches everything when type is empty ("all")', () => {
    expect(matchesDateFilter('2020-01-01', { type: '' })).toBe(true);
    expect(matchesDateFilter(null, { type: '' })).toBe(true);
  });

  it('rejects a missing date for an active filter', () => {
    expect(matchesDateFilter(null, { type: 'last_week' })).toBe(false);
  });

  it('last_week matches the last 7 days including today', () => {
    const today = new Date();
    const toISO = (d) => d.toISOString().split('T')[0];
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);
    const eightDaysAgo = new Date(today);
    eightDaysAgo.setDate(today.getDate() - 8);

    expect(matchesDateFilter(toISO(today), { type: 'last_week' })).toBe(true);
    expect(matchesDateFilter(toISO(sixDaysAgo), { type: 'last_week' })).toBe(true);
    expect(matchesDateFilter(toISO(eightDaysAgo), { type: 'last_week' })).toBe(false);
  });

  it('last_month matches the last 30 days including today', () => {
    const today = new Date();
    const toISO = (d) => d.toISOString().split('T')[0];
    const twentyNineDaysAgo = new Date(today);
    twentyNineDaysAgo.setDate(today.getDate() - 29);
    const thirtyOneDaysAgo = new Date(today);
    thirtyOneDaysAgo.setDate(today.getDate() - 31);

    expect(matchesDateFilter(toISO(today), { type: 'last_month' })).toBe(true);
    expect(matchesDateFilter(toISO(twentyNineDaysAgo), { type: 'last_month' })).toBe(true);
    expect(matchesDateFilter(toISO(thirtyOneDaysAgo), { type: 'last_month' })).toBe(false);
  });

  it('last_year matches the last 12 months including the current one', () => {
    const now = new Date();
    const elevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 15);
    const thirteenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 13, 15);
    const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    expect(matchesDateFilter(toISO(now), { type: 'last_year' })).toBe(true);
    expect(matchesDateFilter(toISO(elevenMonthsAgo), { type: 'last_year' })).toBe(true);
    expect(matchesDateFilter(toISO(thirteenMonthsAgo), { type: 'last_year' })).toBe(false);
  });

  it('month matches only the selected month/year', () => {
    const filter = { type: 'month', month: 3, year: 2024 };
    expect(matchesDateFilter('2024-03-15', filter)).toBe(true);
    expect(matchesDateFilter('2024-04-15', filter)).toBe(false);
    expect(matchesDateFilter('2023-03-15', filter)).toBe(false);
  });

  it('year matches only the selected year', () => {
    const filter = { type: 'year', year: 2022 };
    expect(matchesDateFilter('2022-12-31', filter)).toBe(true);
    expect(matchesDateFilter('2023-01-01', filter)).toBe(false);
  });

  it('period matches an inclusive [startDate, endDate] range', () => {
    const filter = { type: 'period', startDate: '2024-01-10', endDate: '2024-01-20' };
    expect(matchesDateFilter('2024-01-10', filter)).toBe(true);
    expect(matchesDateFilter('2024-01-20', filter)).toBe(true);
    expect(matchesDateFilter('2024-01-15', filter)).toBe(true);
    expect(matchesDateFilter('2024-01-09', filter)).toBe(false);
    expect(matchesDateFilter('2024-01-21', filter)).toBe(false);
  });

  it('period with only a start date is an open-ended range', () => {
    const filter = { type: 'period', startDate: '2024-01-10', endDate: '' };
    expect(matchesDateFilter('2024-01-10', filter)).toBe(true);
    expect(matchesDateFilter('2030-01-01', filter)).toBe(true);
    expect(matchesDateFilter('2024-01-09', filter)).toBe(false);
  });
});
