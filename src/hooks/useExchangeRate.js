import { useState, useCallback } from 'react';
import { CRYPTO_IDS } from '@/utils/currencyUtils';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useExchangeRate = () => {
  const [rates, setRates] = useState({});
  const [lastFetched, setLastFetched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchRates = useCallback(async (currencies = []) => {
    setIsLoading(true);
    const now = Date.now();
    const neededCryptos = currencies.filter(c => CRYPTO_IDS[c] && (!rates[c] || (now - (lastFetched[c] || 0) > CACHE_DURATION)));
    
    let newRates = { ...rates };
    let newFetched = { ...lastFetched };

    // Default fiat fallback rates in case API fails
    if (!newRates['USD']) newRates['USD'] = 5.00;
    if (!newRates['EUR']) newRates['EUR'] = 5.45;
    
    if (neededCryptos.length > 0) {
      try {
        const ids = neededCryptos.map(c => CRYPTO_IDS[c]).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl`);
        const data = await res.json();
        
        neededCryptos.forEach(c => {
          const coinId = CRYPTO_IDS[c];
          if (data[coinId] && data[coinId].brl) {
            newRates[c] = data[coinId].brl;
            newFetched[c] = now;
          }
        });
      } catch (err) {
        console.error("Failed to fetch exchange rates:", err);
      }
    }

    setRates(newRates);
    setLastFetched(newFetched);
    setIsLoading(false);
    return newRates;
  }, [rates, lastFetched]);

  return { rates, fetchRates, isLoading };
};