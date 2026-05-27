export const CRYPTO_OPTIONS = [
  { value: 'BTC', label: 'Bitcoin (BTC)', id: 'bitcoin' },
  { value: 'ETH', label: 'Ethereum (ETH)', id: 'ethereum' },
  { value: 'XRP', label: 'Ripple (XRP)', id: 'ripple' },
  { value: 'USDT', label: 'Tether (USDT)', id: 'tether' },
  { value: 'DOGE', label: 'Dogecoin (DOGE)', id: 'dogecoin' },
  { value: 'ADA', label: 'Cardano (ADA)', id: 'cardano' },
  { value: 'SOL', label: 'Solana (SOL)', id: 'solana' }
];

export const getCryptoId = (symbol) => {
  if (!symbol) return null;
  const option = CRYPTO_OPTIONS.find(o => o.value === symbol);
  return option ? option.id : null;
};