import { describe, it, expect } from 'vitest';
import {
  isCryptoCurrency,
  calculateTotalBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateSpendingByCategory,
  calculateInvestmentReturn,
  calculateTotalInvested,
  calculateTotalInvestmentValue,
  getLastNMonths,
  formatCurrency,
  convertCurrency,
  calculateAccountBalance,
  calculateAssetsLiabilities,
  parseLocaleNumber,
  calculateFaturaTotal,
  calculateFaturaSaidas,
  calculateFaturaEntradas,
  calculateCategoryActivity,
} from '../calculations';

// ─── isCryptoCurrency ────────────────────────────────────────────────────────

describe('isCryptoCurrency', () => {
  it('returns true for known crypto symbols', () => {
    expect(isCryptoCurrency('BTC')).toBe(true);
    expect(isCryptoCurrency('USDT')).toBe(true);
    expect(isCryptoCurrency('XMR')).toBe(true);
  });

  it('returns false for fiat currencies', () => {
    expect(isCryptoCurrency('BRL')).toBe(false);
    expect(isCryptoCurrency('USD')).toBe(false);
    expect(isCryptoCurrency('EUR')).toBe(false);
  });

  it('returns false for empty or undefined input', () => {
    expect(isCryptoCurrency('')).toBe(false);
    expect(isCryptoCurrency(undefined)).toBe(false);
    expect(isCryptoCurrency(null)).toBe(false);
  });
});

// ─── parseLocaleNumber ────────────────────────────────────────────────────────

describe('parseLocaleNumber', () => {
  it('parses plain and dot-decimal numbers unchanged', () => {
    expect(parseLocaleNumber('1234.56')).toBe('1234.56');
    expect(parseLocaleNumber('1234')).toBe('1234');
  });

  it('converts a comma decimal to a dot', () => {
    expect(parseLocaleNumber('1234,56')).toBe('1234.56');
  });

  it('treats "." as a thousands separator when both "." and "," are present', () => {
    expect(parseLocaleNumber('1.234,56')).toBe('1234.56');
  });

  it('preserves a leading minus sign', () => {
    expect(parseLocaleNumber('-1.234,56')).toBe('-1234.56');
  });

  it('strips a currency symbol and stray whitespace', () => {
    expect(parseLocaleNumber('R$ 1.234,56')).toBe('1234.56');
    expect(parseLocaleNumber(' 1.234,56 ')).toBe('1234.56');
  });

  it('strips a trailing bank credit/debit suffix', () => {
    expect(parseLocaleNumber('1.234,56 CR')).toBe('1234.56');
  });

  it('treats a parenthesized value as negative (accounting convention)', () => {
    expect(parseLocaleNumber('(1.234,56)')).toBe('-1234.56');
  });

  it('handles empty/nullish input', () => {
    expect(parseLocaleNumber('')).toBe('');
    expect(parseLocaleNumber(null)).toBe('');
    expect(parseLocaleNumber(undefined)).toBe('');
  });
});

// ─── calculateTotalBalance ───────────────────────────────────────────────────

describe('calculateTotalBalance', () => {
  it('returns 0 for empty list', () => {
    expect(calculateTotalBalance([])).toBe(0);
  });

  it('sums account balances', () => {
    const accounts = [{ balance: 100 }, { balance: 250.5 }, { balance: 50 }];
    expect(calculateTotalBalance(accounts)).toBe(400.5);
  });

  it('treats missing balance as 0', () => {
    expect(calculateTotalBalance([{ balance: undefined }, { balance: 100 }])).toBe(100);
  });

  it('handles negative balances', () => {
    expect(calculateTotalBalance([{ balance: 500 }, { balance: -200 }])).toBe(300);
  });
});

// ─── calculateMonthlyIncome ──────────────────────────────────────────────────

describe('calculateMonthlyIncome', () => {
  const transactions = [
    { date: '2024-06-01', type: 'income', amount: 1000 },
    { date: '2024-06-15', type: 'income', amount: 500 },
    { date: '2024-06-10', type: 'expense', amount: -200 },
    { date: '2024-05-20', type: 'income', amount: 800 },
  ];

  it('sums income for the given month', () => {
    expect(calculateMonthlyIncome(transactions, '2024-06')).toBe(1500);
  });

  it('ignores expenses', () => {
    const onlyExpenses = [{ date: '2024-06-01', type: 'expense', amount: -300 }];
    expect(calculateMonthlyIncome(onlyExpenses, '2024-06')).toBe(0);
  });

  it('ignores transactions from other months', () => {
    expect(calculateMonthlyIncome(transactions, '2024-07')).toBe(0);
  });

  it('returns 0 for empty list', () => {
    expect(calculateMonthlyIncome([], '2024-06')).toBe(0);
  });
});

// ─── calculateMonthlyExpenses ────────────────────────────────────────────────

describe('calculateMonthlyExpenses', () => {
  const transactions = [
    { date: '2024-06-01', type: 'expense', amount: -150 },
    { date: '2024-06-15', type: 'expense', amount: -350 },
    { date: '2024-06-10', type: 'income', amount: 200 },
    { date: '2024-05-20', type: 'expense', amount: -100 },
  ];

  it('sums expenses for the given month as a positive number', () => {
    expect(calculateMonthlyExpenses(transactions, '2024-06')).toBe(500);
  });

  it('ignores income', () => {
    const onlyIncome = [{ date: '2024-06-01', type: 'income', amount: 300 }];
    expect(calculateMonthlyExpenses(onlyIncome, '2024-06')).toBe(0);
  });

  it('returns 0 for empty list', () => {
    expect(calculateMonthlyExpenses([], '2024-06')).toBe(0);
  });
});

// ─── calculateSpendingByCategory ─────────────────────────────────────────────

describe('calculateSpendingByCategory', () => {
  it('returns empty object for no transactions', () => {
    expect(calculateSpendingByCategory([])).toEqual({});
  });

  it('groups expense amounts by category', () => {
    const transactions = [
      { type: 'expense', category: 'food', amount: -50 },
      { type: 'expense', category: 'food', amount: -30 },
      { type: 'expense', category: 'transport', amount: -20 },
    ];
    const result = calculateSpendingByCategory(transactions);
    expect(result.food).toBe(80);
    expect(result.transport).toBe(20);
  });

  it('ignores income', () => {
    const transactions = [{ type: 'income', category: 'salary', amount: 3000 }];
    expect(calculateSpendingByCategory(transactions)).toEqual({});
  });
});

// ─── calculateCategoryActivity ───────────────────────────────────────────────

describe('calculateCategoryActivity', () => {
  // A day guaranteed to be in the past relative to "now" (regardless of the
  // time of day the suite runs), while still safely inside the 'yearly'
  // period window used below.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pastDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  it('returns zeros for no categoryId or no transactions', () => {
    expect(calculateCategoryActivity(null, 'yearly', [])).toEqual({ spending: 0, total: 0 });
    expect(calculateCategoryActivity('cat-1', 'yearly', null)).toEqual({ spending: 0, total: 0 });
  });

  it('sums spending and total activity for a single category id', () => {
    const transactions = [
      { category_id: 'cat-1', type: 'expense', amount: -50, date: pastDate },
      { category_id: 'cat-1', type: 'expense', amount: -30, date: pastDate },
      { category_id: 'cat-1', type: 'income', amount: 100, date: pastDate },
      { category_id: 'cat-2', type: 'expense', amount: -999, date: pastDate },
    ];
    const result = calculateCategoryActivity('cat-1', 'yearly', transactions);
    expect(result.spending).toBe(80);
    expect(result.total).toBe(180);
  });

  it('rolls up activity across an array of category ids (parent + subcategories)', () => {
    const transactions = [
      { category_id: 'parent', type: 'expense', amount: -100, date: pastDate },
      { category_id: 'child-1', type: 'expense', amount: -40, date: pastDate },
      { category_id: 'child-2', type: 'expense', amount: -20, date: pastDate },
      { category_id: 'unrelated', type: 'expense', amount: -999, date: pastDate },
    ];
    const result = calculateCategoryActivity(['parent', 'child-1', 'child-2'], 'yearly', transactions);
    expect(result.spending).toBe(160);
    expect(result.total).toBe(160);
  });

  it('excludes transactions outside the period', () => {
    const transactions = [
      { category_id: 'cat-1', type: 'expense', amount: -50, date: '2000-01-01' },
    ];
    const result = calculateCategoryActivity('cat-1', 'monthly', transactions);
    expect(result.spending).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ─── calculateInvestmentReturn ───────────────────────────────────────────────

describe('calculateInvestmentReturn', () => {
  it('returns 0 when invested is 0', () => {
    expect(calculateInvestmentReturn(0, 1000)).toBe(0);
  });

  it('returns 0 for break-even', () => {
    expect(calculateInvestmentReturn(100, 100)).toBe(0);
  });

  it('calculates positive return', () => {
    expect(calculateInvestmentReturn(100, 150)).toBe(50);
  });

  it('calculates negative return', () => {
    expect(calculateInvestmentReturn(100, 50)).toBe(-50);
  });
});

// ─── calculateTotalInvested / calculateTotalInvestmentValue ──────────────────

describe('calculateTotalInvested', () => {
  it('returns 0 for empty list', () => {
    expect(calculateTotalInvested([])).toBe(0);
  });

  it('sums investedAmount across investments', () => {
    const investments = [{ investedAmount: 1000 }, { investedAmount: 2500 }];
    expect(calculateTotalInvested(investments)).toBe(3500);
  });
});

describe('calculateTotalInvestmentValue', () => {
  it('returns 0 for empty list', () => {
    expect(calculateTotalInvestmentValue([])).toBe(0);
  });

  it('sums currentAmount across investments', () => {
    const investments = [{ currentAmount: 1200 }, { currentAmount: 2800 }];
    expect(calculateTotalInvestmentValue(investments)).toBe(4000);
  });
});

// ─── getLastNMonths ──────────────────────────────────────────────────────────

describe('getLastNMonths', () => {
  it('returns exactly n months', () => {
    expect(getLastNMonths(6)).toHaveLength(6);
    expect(getLastNMonths(1)).toHaveLength(1);
    expect(getLastNMonths(12)).toHaveLength(12);
  });

  it('returns months in ascending order', () => {
    const months = getLastNMonths(3);
    expect(months[0] < months[1]).toBe(true);
    expect(months[1] < months[2]).toBe(true);
  });

  it('formats months as YYYY-MM', () => {
    const months = getLastNMonths(3);
    months.forEach(m => expect(m).toMatch(/^\d{4}-\d{2}$/));
  });
});

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a positive value in BRL', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
    expect(result).toMatch(/R\$/);
  });

  it('prefixes negative values with a minus sign', () => {
    const result = formatCurrency(-50);
    expect(result.startsWith('-')).toBe(true);
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/R\$/);
    expect(result).toContain('0');
  });

  it('treats non-numeric input as 0', () => {
    expect(formatCurrency('abc')).toEqual(formatCurrency(0));
    expect(formatCurrency(undefined)).toEqual(formatCurrency(0));
  });
});

// ─── convertCurrency ─────────────────────────────────────────────────────────

describe('convertCurrency', () => {
  it('returns same amount when currencies match', () => {
    expect(convertCurrency(100, 'BRL', 'BRL', 5)).toBe(100);
  });

  it('returns same amount when no exchange rate provided', () => {
    expect(convertCurrency(100, 'USD', 'BRL', null)).toBe(100);
    expect(convertCurrency(100, 'USD', 'BRL', 0)).toBe(100);
  });

  it('skips conversion for crypto source currency', () => {
    expect(convertCurrency(1, 'BTC', 'BRL', 350000)).toBe(1);
  });

  it('skips conversion for crypto target currency', () => {
    expect(convertCurrency(350000, 'BRL', 'BTC', 1 / 350000)).toBe(350000);
  });

  it('applies exchange rate for fiat conversion', () => {
    expect(convertCurrency(100, 'USD', 'BRL', 5.2)).toBeCloseTo(520);
  });

  it('returns 0 for falsy amount', () => {
    expect(convertCurrency(0, 'USD', 'BRL', 5)).toBe(0);
    expect(convertCurrency(null, 'USD', 'BRL', 5)).toBe(0);
  });
});

// ─── calculateAccountBalance ─────────────────────────────────────────────────

describe('calculateAccountBalance', () => {
  const ACC = 'acc-1';
  const OTHER = 'acc-2';

  it('returns initialBalance when there are no transactions', () => {
    expect(calculateAccountBalance([], ACC, 500)).toBe(500);
  });

  it('defaults initialBalance to 0 when not provided', () => {
    expect(calculateAccountBalance([], ACC)).toBe(0);
  });

  it('adds income transactions', () => {
    const txs = [{ type: 'income', account_id: ACC, amount: 200 }];
    expect(calculateAccountBalance(txs, ACC, 100)).toBe(300);
  });

  it('subtracts expense transactions', () => {
    const txs = [{ type: 'expense', account_id: ACC, amount: -150 }];
    expect(calculateAccountBalance(txs, ACC, 500)).toBe(350);
  });

  it('subtracts payment transactions', () => {
    const txs = [{ type: 'payment', account_id: ACC, amount: -100 }];
    expect(calculateAccountBalance(txs, ACC, 500)).toBe(400);
  });

  it('subtracts from source on transfer', () => {
    const txs = [{ type: 'transfer', account_id: ACC, destination_account_id: OTHER, amount: -200 }];
    expect(calculateAccountBalance(txs, ACC, 500)).toBe(300);
  });

  it('adds to destination on transfer', () => {
    const txs = [{ type: 'transfer', account_id: OTHER, destination_account_id: ACC, amount: -200 }];
    expect(calculateAccountBalance(txs, ACC, 0)).toBe(200);
  });

  it('uses converted_amount for cross-currency transfer destination', () => {
    const txs = [{
      type: 'transfer',
      account_id: OTHER,
      destination_account_id: ACC,
      amount: -100,
      converted_amount: 520,
    }];
    expect(calculateAccountBalance(txs, ACC, 0)).toBe(520);
  });

  it('ignores transactions for other accounts', () => {
    const txs = [{ type: 'income', account_id: OTHER, amount: 1000 }];
    expect(calculateAccountBalance(txs, ACC, 200)).toBe(200);
  });

  it('handles non-array gracefully', () => {
    expect(calculateAccountBalance(null, ACC, 100)).toBe(100);
    expect(calculateAccountBalance(undefined, ACC, 50)).toBe(50);
  });
});

// ─── calculateAssetsLiabilities ──────────────────────────────────────────────

describe('calculateAssetsLiabilities', () => {
  it('returns zeros for empty inputs', () => {
    expect(calculateAssetsLiabilities()).toEqual({ assets: 0, liabilities: 0 });
  });

  it('counts positive account balances as assets', () => {
    const accounts = [{ balance: 1000, currency: 'BRL' }];
    const { assets, liabilities } = calculateAssetsLiabilities([], accounts);
    expect(assets).toBe(1000);
    expect(liabilities).toBe(0);
  });

  it('counts negative account balances as liabilities', () => {
    const accounts = [{ balance: -500, currency: 'BRL' }];
    const { assets, liabilities } = calculateAssetsLiabilities([], accounts);
    expect(assets).toBe(0);
    expect(liabilities).toBe(500);
  });

  it('counts a credit card balance as a liability even when positive', () => {
    const accounts = [{ balance: 350, currency: 'BRL', type: 'credit_card' }];
    const { assets, liabilities } = calculateAssetsLiabilities([], accounts);
    expect(assets).toBe(0);
    expect(liabilities).toBe(350);
  });

  it('prefers current_fatura_value over balance for a credit card, since balance is disconnected from invoice debt', () => {
    const accounts = [{ balance: 0, currency: 'BRL', type: 'credit_card', current_fatura_value: 842.5 }];
    const { assets, liabilities } = calculateAssetsLiabilities([], accounts);
    expect(assets).toBe(0);
    expect(liabilities).toBe(842.5);
  });

  it('counts a loan account (identified via account_subtype) as a liability', () => {
    const accounts = [{ balance: 1200, currency: 'BRL', account_subtype: 'loan' }];
    const { assets, liabilities } = calculateAssetsLiabilities([], accounts);
    expect(assets).toBe(0);
    expect(liabilities).toBe(1200);
  });

  it('applies exchange rate to foreign currency accounts', () => {
    const accounts = [{ balance: 100, currency: 'USD' }];
    const exchangeRates = { USD: 5.2 };
    const { assets } = calculateAssetsLiabilities([], accounts, [], exchangeRates);
    expect(assets).toBeCloseTo(520);
  });

  it('adds pending recurring to liabilities', () => {
    const recurring = [{ status: 'pending', amount: 300 }];
    const { liabilities } = calculateAssetsLiabilities([], [], recurring);
    expect(liabilities).toBe(300);
  });

  it('excludes paid recurring from liabilities', () => {
    const recurring = [
      { status: 'pago', amount: 200 },
      { status: 'Concluído', amount: 150 },
    ];
    const { liabilities } = calculateAssetsLiabilities([], [], recurring);
    expect(liabilities).toBe(0);
  });
});

// ─── calculateFaturaTotal / calculateFaturaSaidas / calculateFaturaEntradas ──

describe('calculateFaturaTotal', () => {
  it('returns 0 for empty list', () => {
    expect(calculateFaturaTotal([])).toBe(0);
  });

  it('sums only negative (expense) amounts', () => {
    const compras = [{ amount: -100 }, { amount: -50 }, { amount: 20 }];
    expect(calculateFaturaTotal(compras)).toBe(-150);
  });

  it('returns 0 when all amounts are positive', () => {
    expect(calculateFaturaTotal([{ amount: 100 }, { amount: 50 }])).toBe(0);
  });
});

describe('calculateFaturaSaidas', () => {
  it('matches calculateFaturaTotal behaviour', () => {
    const compras = [{ amount: -80 }, { amount: -40 }, { amount: 10 }];
    expect(calculateFaturaSaidas(compras)).toBe(-120);
  });
});

describe('calculateFaturaEntradas', () => {
  it('returns 0 for empty list', () => {
    expect(calculateFaturaEntradas([])).toBe(0);
  });

  it('sums positive amounts without transaction_id', () => {
    const compras = [
      { amount: 50 },
      { amount: 30 },
      { amount: 20, transaction_id: 'tx-1' }, // excluded (linked payment)
      { amount: -100 },                       // excluded (expense)
    ];
    expect(calculateFaturaEntradas(compras)).toBe(80);
  });
});
