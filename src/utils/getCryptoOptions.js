export const CRYPTO_OPTIONS = [
  { value: 'BTC', label: 'Bitcoin (BTC)', id: 'bitcoin' },
  { value: 'USDT', label: 'Tether (USDT)', id: 'tether' },
  { value: 'XMR', label: 'Monero (XMR)', id: 'monero' }
];

export const getCryptoId = (symbol) => {
  if (!symbol) return null;
  const option = CRYPTO_OPTIONS.find(o => o.value === symbol);
  return option ? option.id : null;
};