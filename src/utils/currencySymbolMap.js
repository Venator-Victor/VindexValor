export const CURRENCY_MAP = {
  BRL: { symbol: 'R$', name: 'Real', decimals: 2 },
  USD: { symbol: '$', name: 'Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  BTC: { symbol: '₿', name: 'Bitcoin', decimals: 8 },
  ETH: { symbol: 'Ξ', name: 'Ethereum', decimals: 8 },
  XRP: { symbol: 'XRP', name: 'Ripple', decimals: 6 },
  USDT: { symbol: '₮', name: 'Tether', decimals: 6 },
  DOGE: { symbol: 'Ð', name: 'Dogecoin', decimals: 6 },
  ADA: { symbol: '₳', name: 'Cardano', decimals: 6 },
  SOL: { symbol: 'SOL', name: 'Solana', decimals: 6 }
};

export const FIAT_OPTIONS = [
  { value: 'BRL', label: 'Real Brasileiro (BRL)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' }
];

export const CRYPTO_OPTIONS = [
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'XRP', label: 'Ripple (XRP)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'DOGE', label: 'Dogecoin (DOGE)' },
  { value: 'ADA', label: 'Cardano (ADA)' },
  { value: 'SOL', label: 'Solana (SOL)' }
];

export const getCurrencySymbol = (currencyCode) => {
  return CURRENCY_MAP[currencyCode]?.symbol || currencyCode || 'R$';
};

export const getCurrencyDecimals = (currencyCode) => {
  return CURRENCY_MAP[currencyCode]?.decimals || 2;
};

export const isCryptoCurrency = (currencyCode) => {
  return CRYPTO_OPTIONS.some(opt => opt.value === currencyCode);
};