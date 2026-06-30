import { CURRENCY_MAP, getCurrencySymbol, getCurrencyDecimals } from './currencySymbolMap';

export const isCryptoCurrency = (currency) => {
  const cryptoSymbols = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'USDC', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'LINK', 'SHIB', 'LTC'];
  return cryptoSymbols.includes(currency);
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

export const formatCurrency = (value) => {
  const numValue = Number(value) || 0;
  const isNegative = numValue < 0;
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
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
      if (currencyCode === 'ETH') symbol = 'Ξ';
    }
  }

  const numValue = Number(amount) || 0;
  const isNegative = numValue < 0;

  const formatted = new Intl.NumberFormat('pt-BR', {
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

export const calculateAssetsLiabilities = (transactions = [], accounts = [], recurring = [], exchangeRates = {}) => {
  let assets = 0;
  let liabilities = 0;

  if (Array.isArray(accounts)) {
    accounts.forEach(acc => {
      const currency = acc.currency || 'BRL';
      const rate = exchangeRates[currency] || 1;
      const bal = Number(acc.balance !== undefined ? acc.balance : (acc.initial_balance || 0));
      const convertedBal = bal * (currency === 'BRL' ? 1 : rate);
      
      if (convertedBal > 0) assets += convertedBal;
      if (convertedBal < 0) liabilities += Math.abs(convertedBal);
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