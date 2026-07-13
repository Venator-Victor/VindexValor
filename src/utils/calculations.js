import { CURRENCY_MAP, getCurrencySymbol, getCurrencyDecimals, getCurrencyLocale } from './currencySymbolMap';

export const isCryptoCurrency = (currency) => {
  const cryptoSymbols = ['BTC', 'USDT', 'XMR'];
  return cryptoSymbols.includes(currency);
};

// Normalizes a free-typed or CSV-sourced number so "1234.56", "1234,56", "R$ 1.234,56"
// and "(1.234,56)" all parse correctly, regardless of the user's OS/keyboard locale or
// how a bank export happens to format a particular line. Bank statement CSVs often
// format one line differently from the rest (a currency prefix, a "CR"/"DB" suffix, a
// stray non-breaking space) — without stripping that first, parseFloat chokes on the
// leading garbage and silently returns 0 instead of the real amount. When both "." and
// "," are present, "." is treated as a thousands separator and "," as the decimal
// ("1.234,56" -> "1234.56").
export const parseLocaleNumber = (input) => {
  let str = String(input ?? '').trim();

  // Accounting convention: a value wrapped in parentheses is negative, e.g. "(1.234,56)".
  const isParenNegative = /^\(.*\)$/.test(str);
  if (isParenNegative) str = str.slice(1, -1).trim();

  // Strip everything except digits, separators, and a leading minus — currency symbols,
  // whitespace, and letter suffixes ("R$", "CR", "BRL"...) would otherwise make parseFloat fail.
  str = str.replace(/[^\d.,-]/g, '');

  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  return isParenNegative && !str.startsWith('-') ? `-${str}` : str;
};

export const calculateTotalBalance = (accounts) => {
  return accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
};

export const calculateMonthlyIncome = (transactions, month) => {
  return transactions
    .filter(t => t.date.startsWith(month) && t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
};

export const calculateMonthlyExpenses = (transactions, month) => {
  return Math.abs(
    transactions
      .filter(t => t.date.startsWith(month) && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  );
};

export const getPeriodStartDate = (period, referenceDate = new Date()) => {
  const startDate = new Date(referenceDate);
  switch (period) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly': {
      const diff = startDate.getDate() - startDate.getDay();
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'biweekly':
      startDate.setDate(startDate.getDate() <= 15 ? 1 : 16);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'quarterly':
      startDate.setMonth(startDate.getMonth() - (startDate.getMonth() % 3), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'semiannual':
      startDate.setMonth(startDate.getMonth() - (startDate.getMonth() % 6), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
    default:
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
  }
  return startDate;
};

// Returns both expense-only spending (for budget tracking) and total activity
// (all transaction types) for a category within the given period, since categories
// without an active budget (e.g. income categories) are better summarized by total
// movement than by "spending". Accepts either a single category id or an array of
// ids (e.g. a parent category plus its subcategories) to roll up activity together.
export const calculateCategoryActivity = (categoryId, period, transactions) => {
  if (!categoryId || !transactions) return { spending: 0, total: 0 };

  const categoryIds = Array.isArray(categoryId) ? categoryId : [categoryId];
  const now = new Date();
  const startDate = getPeriodStartDate(period, now);

  return transactions
    .filter(t => {
      if (!categoryIds.includes(t.category_id)) return false;
      const tDate = new Date(t.date + 'T12:00:00');
      return tDate >= startDate && tDate <= now;
    })
    .reduce((acc, t) => {
      const amount = Math.abs(Number(t.amount) || 0);
      acc.total += amount;
      if (t.type === 'expense') acc.spending += amount;
      return acc;
    }, { spending: 0, total: 0 });
};

export const calculateSpendingByCategory = (transactions) => {
  const spending = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (!spending[t.category]) {
        spending[t.category] = 0;
      }
      spending[t.category] += Math.abs(Number(t.amount));
    });
  return spending;
};

export const calculateInvestmentReturn = (invested, current) => {
  if (invested === 0) return 0;
  return ((current - invested) / invested) * 100;
};

export const calculateTotalInvested = (investments) => {
  return investments.reduce((sum, inv) => sum + Number(inv.investedAmount), 0);
};

export const calculateTotalInvestmentValue = (investments) => {
  return investments.reduce((sum, inv) => sum + Number(inv.currentAmount), 0);
};

export const getLastNMonths = (n) => {
  const months = [];
  const now = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  
  return months;
};

export const formatCurrency = (value, currency = 'BRL') => {
  const numValue = Number(value) || 0;
  const isNegative = numValue < 0;
  const locale = getCurrencyLocale(currency);
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(Math.abs(numValue));

  return isNegative ? `-${formatted}` : formatted;
};

export const formatCurrencyWithSymbol = (amount, currencyCode = 'BRL') => {
  let decimals = 2;
  let symbol = currencyCode;

  try {
    if (typeof getCurrencyDecimals === 'function') {
      decimals = getCurrencyDecimals(currencyCode) ?? 2;
    }
    if (typeof getCurrencySymbol === 'function') {
      symbol = getCurrencySymbol(currencyCode) || currencyCode;
    }
  } catch (e) {
    // fallback if context missing
  }

  // Ensure 8 decimals for cryptocurrencies
  if (isCryptoCurrency(currencyCode)) {
    decimals = 8;
    if (!symbol || symbol === currencyCode) {
      symbol = currencyCode;
      if (currencyCode === 'BTC') symbol = '₿';
    }
  }

  const numValue = Number(amount) || 0;
  const isNegative = numValue < 0;

  const locale = getCurrencyLocale(currencyCode);
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(numValue));

  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
};

export const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRate) => {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency || !exchangeRate) return Number(amount);
  
  // Skip unwanted automatic conversions for crypto accounts
  if (isCryptoCurrency(fromCurrency) || isCryptoCurrency(toCurrency)) {
    return Number(amount);
  }
  
  return Number(amount) * Number(exchangeRate);
};

export const calculateAccountBalance = (transactions, accountId, initialBalance = 0) => {
  if (!transactions || !Array.isArray(transactions)) return Number(initialBalance || 0);
  
  const transactionsSum = transactions.reduce((acc, t) => {
    let absAmount = Math.abs(Number(t.amount));
    
    if (t.type === 'transfer') {
      if (t.account_id === accountId) {
        return acc - absAmount; 
      }
      if (t.destination_account_id === accountId) {
         if (t.converted_amount != null && t.converted_amount !== '') {
           return acc + Math.abs(Number(t.converted_amount));
         }
         return acc + absAmount;
      }
    }

    if (t.type === 'income' && t.account_id === accountId) {
      return acc + absAmount;
    }
    if (t.type === 'expense' && t.account_id === accountId) {
      return acc - absAmount;
    }
    if (t.type === 'payment' && t.account_id === accountId) {
      return acc - absAmount;
    }

    return acc;
  }, 0);

  return Number(initialBalance || 0) + transactionsSum;
};

// Accounts of these types are debt by nature — their balance magnitude is
// always a liability, regardless of sign (a credit card sitting at 0 isn't
// an asset). Everything else falls back to the sign of its balance.
const LIABILITY_ACCOUNT_TYPES = ['credit_card', 'loan'];

export const calculateAssetsLiabilities = (transactions = [], accounts = [], recurring = [], exchangeRates = {}) => {
  let assets = 0;
  let liabilities = 0;

  if (Array.isArray(accounts)) {
    accounts.forEach(acc => {
      const currency = acc.currency || 'BRL';
      const rate = exchangeRates[currency] || 1;
      const convert = (v) => v * (currency === 'BRL' ? 1 : rate);
      const isCreditCard = acc.type === 'credit_card' || acc.account_subtype === 'credit_card';
      const isLiabilityType = isCreditCard || LIABILITY_ACCOUNT_TYPES.includes(acc.type) || LIABILITY_ACCOUNT_TYPES.includes(acc.account_subtype);

      // A credit card's `balance` is computed purely from transactions, but card
      // purchases live in invoices instead — so balance is disconnected from what's
      // actually owed. current_fatura_value (the invoice system's running total) is
      // the real debt figure when it's available.
      if (isCreditCard && acc.current_fatura_value !== undefined) {
        liabilities += convert(Number(acc.current_fatura_value));
        return;
      }

      const bal = Number(acc.balance !== undefined ? acc.balance : (acc.initial_balance || 0));
      const convertedBal = convert(bal);

      if (isLiabilityType) {
        liabilities += Math.abs(convertedBal);
      } else if (convertedBal > 0) {
        assets += convertedBal;
      } else if (convertedBal < 0) {
        liabilities += Math.abs(convertedBal);
      }
    });
  }

  if (Array.isArray(recurring)) {
    recurring.forEach(r => {
      if (r.status !== 'paid' && r.status !== 'pago' && r.status !== 'Concluído') {
        liabilities += Math.abs(Number(r.amount || 0));
      }
    });
  }

  return { assets, liabilities };
};

export const calculateFaturaTotal = (compras = []) => {
  // Only count actual purchases (negative/expense transactions)
  return compras.filter(c => Number(c.amount) < 0).reduce((acc, c) => acc + Number(c.amount), 0);
};

export const calculateFaturaSaidas = (compras = []) => {
  return compras.filter(c => Number(c.amount) < 0).reduce((acc, c) => acc + Number(c.amount), 0);
};

export const calculateFaturaEntradas = (compras = []) => {
  // Payments are excluded from fatura totals as requested, but if needed specifically for display, calculate here
  return compras.filter(c => Number(c.amount) > 0 && !c.transaction_id).reduce((acc, c) => acc + Number(c.amount), 0);
};