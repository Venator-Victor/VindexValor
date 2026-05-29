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
  calculateFaturaTotal,
  calculateFaturaSaidas,
  calculateFaturaEntradas,
} from '../calculations';

// ─── isCryptoCurrency ────────────────────────────────────────────────────────

describe('isCryptoCurrency', () => {
  it('returns true for known crypto symbols', () => {
    expect(isCryptoCurrency('BTC')).toBe(true);
    expect(isCryptoCurrency('ETH')).toBe(true);
    expect(isCryptoCurrency('SOL')).toBe(true);
    expect(isCryptoCurrency('DOGE')).toBe(true);
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
    { date: '2024-06-01', type: 'entrada', amount: 1000 },
    { date: '2024-06-15', type: 'entrada', amount: 500 },
    { date: '2024-06-10', type: 'saida', amount: -200 },
    { date: '2024-05-20', type: 'entrada', amount: 800 },
  ];

  it('sums entradas for the given month', () => {
    expect(calculateMonthlyIncome(transactions, '2024-06')).toBe(1500);
  });

  it('ignores saidas', () => {
    const onlySaidas = [{ date: '2024-06-01', type: 'saida', amount: -300 }];
    expect(calculateMonthlyIncome(onlySaidas, '2024-06')).toBe(0);
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
    { date: '2024-06-01', type: 'saida', amount: -150 },
    { date: '2024-06-15', type: 'saida', amount: -350 },
    { date: '2024-06-10', type: 'entrada', amount: 200 },
    { date: '2024-05-20', type: 'saida', amount: -100 },
  ];

  it('sums saidas for the given month as a positive number', () => {
    expect(calculateMonthlyExpenses(transactions, '2024-06')).toBe(500);
  });

  it('ignores entradas', () => {
    const onlyEntradas = [{ date: '2024-06-01', type: 'entrada', amount: 300 }];
    expect(calculateMonthlyExpenses(onlyEntradas, '2024-06')).toBe(0);
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

  it('groups saida amounts by category', () => {
    const transactions = [
      { type: 'saida', category: 'food', amount: -50 },
      { type: 'saida', category: 'food', amount: -30 },
      { type: 'saida', category: 'transport', amount: -20 },
    ];
    const result = calculateSpendingByCategory(transactions);
    expect(result.food).toBe(80);
    expect(result.transport).toBe(20);
  });

  it('ignores entradas', () => {
    const transactions = [{ type: 'entrada', category: 'salary', amount: 3000 }];
    expect(calculateSpendingByCategory(transactions)).toEqual({});
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

  it('adds entrada transactions', () => {
    const txs = [{ type: 'entrada', conta_id: ACC, amount: 200 }];
    expect(calculateAccountBalance(txs, ACC, 100)).toBe(300);
  });

  it('subtracts saida transactions', () => {
    const txs = [{ type: 'saida', conta_id: ACC, amount: -150 }];
    expect(calculateAccountBalance(txs, ACC, 500)).toBe(350);
  });

  it('subtracts pagamento transactions', () => {
    const txs = [{ type: 'pagamento', conta_id: ACC, amount: -100 }];
    expect(calculateAccountBalance(txs, ACC, 500)).toBe(400);
  });

  it('subtracts from source on transferencia', () => {
    const txs = [{ type: 'transferencia', conta_id: ACC, conta_destino_id: OTHER, amount: -200 }];
    expect(calculateAccountBalance(txs, ACC, 500)).toBe(300);
  });

  it('adds to destination on transferencia', () => {
    const txs = [{ type: 'transferencia', conta_id: OTHER, conta_destino_id: ACC, amount: -200 }];
    expect(calculateAccountBalance(txs, ACC, 0)).toBe(200);
  });

  it('uses converted_amount for cross-currency transferencia destination', () => {
    const txs = [{
      type: 'transferencia',
      conta_id: OTHER,
      conta_destino_id: ACC,
      amount: -100,
      converted_amount: 520,
    }];
    expect(calculateAccountBalance(txs, ACC, 0)).toBe(520);
  });

  it('ignores transactions for other accounts', () => {
    const txs = [{ type: 'entrada', conta_id: OTHER, amount: 1000 }];
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

  it('sums only negative (expense) valores', () => {
    const compras = [{ valor: -100 }, { valor: -50 }, { valor: 20 }];
    expect(calculateFaturaTotal(compras)).toBe(-150);
  });

  it('returns 0 when all valores are positive', () => {
    expect(calculateFaturaTotal([{ valor: 100 }, { valor: 50 }])).toBe(0);
  });
});

describe('calculateFaturaSaidas', () => {
  it('matches calculateFaturaTotal behaviour', () => {
    const compras = [{ valor: -80 }, { valor: -40 }, { valor: 10 }];
    expect(calculateFaturaSaidas(compras)).toBe(-120);
  });
});

describe('calculateFaturaEntradas', () => {
  it('returns 0 for empty list', () => {
    expect(calculateFaturaEntradas([])).toBe(0);
  });

  it('sums positive valores without transacao_id', () => {
    const compras = [
      { valor: 50 },
      { valor: 30 },
      { valor: 20, transacao_id: 'tx-1' }, // excluded (linked payment)
      { valor: -100 },                       // excluded (expense)
    ];
    expect(calculateFaturaEntradas(compras)).toBe(80);
  });
});
