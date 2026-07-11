// Single source of truth for currency display: symbol, decimal places, and the
// Intl locale that decides the decimal/thousands separator (e.g. BRL -> "1.234,56", USD -> "1,234.56").
export const CURRENCY_MAP = {
  BRL: { symbol: 'R$', name: 'Real', decimals: 2, locale: 'pt-BR' },
  USD: { symbol: '$', name: 'Dollar', decimals: 2, locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', decimals: 2, locale: 'en-US' },
  BTC: { symbol: '₿', name: 'Bitcoin', decimals: 8, locale: 'pt-BR' },
  USDT: { symbol: '₮', name: 'Tether', decimals: 6, locale: 'pt-BR' },
  XMR: { symbol: 'ɱ', name: 'Monero', decimals: 8, locale: 'pt-BR' }
};

export const FIAT_OPTIONS = [
  { value: 'BRL', label: 'Real Brasileiro (BRL)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' }
];

export const CRYPTO_OPTIONS = [
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'XMR', label: 'Monero (XMR)' }
];

export const getCurrencySymbol = (currencyCode) => {
  return CURRENCY_MAP[currencyCode]?.symbol || currencyCode || 'R$';
};

export const getCurrencyDecimals = (currencyCode) => {
  return CURRENCY_MAP[currencyCode]?.decimals || 2;
};

export const getCurrencyLocale = (currencyCode) => {
  return CURRENCY_MAP[currencyCode]?.locale || 'pt-BR';
};

export const isCryptoCurrency = (currencyCode) => {
  return CRYPTO_OPTIONS.some(opt => opt.value === currencyCode);
};