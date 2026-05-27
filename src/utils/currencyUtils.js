export const CURRENCY_SYMBOLS = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  BTC: '₿',
  ETH: 'Ξ',
  XRP: 'XRP',
  ADA: '₳',
  SOL: 'SOL',
  DOGE: 'Ð'
};

export const CRYPTO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  XRP: 'ripple',
  ADA: 'cardano',
  SOL: 'solana',
  DOGE: 'dogecoin'
};

export const getCurrencySymbol = (currency) => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

export const formatCurrencyValue = (value, currency = 'BRL') => {
  const isCrypto = Object.keys(CRYPTO_IDS).includes(currency);
  const decimals = isCrypto ? 6 : 2;
  const numValue = Number(value) || 0;
  
  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(numValue);

  return `${formatted} ${getCurrencySymbol(currency)}`;
};