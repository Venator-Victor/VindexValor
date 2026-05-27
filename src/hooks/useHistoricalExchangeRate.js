import { useState, useCallback, useRef } from 'react';
import { getCryptoId } from '@/utils/getCryptoOptions';

export const useHistoricalExchangeRate = () => {
  const [rates, setRates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef({});

  const fetchHistoricalRate = useCallback(async (cryptoSymbol, dateStr) => {
    if (!cryptoSymbol || !dateStr) return null;
    
    const cryptoId = getCryptoId(cryptoSymbol);
    if (!cryptoId) return null;

    // Date format must be DD-MM-YYYY for CoinGecko historical endpoint
    const [year, month, day] = dateStr.split('-');
    const formattedDate = `${day}-${month}-${year}`;
    
    const cacheKey = `${cryptoId}-${formattedDate}`;
    if (cache.current[cacheKey]) {
      return cache.current[cacheKey];
    }

    setIsLoading(true);
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/history?date=${formattedDate}`);
      const data = await res.json();
      
      if (data.market_data && data.market_data.current_price && data.market_data.current_price.brl) {
        const rate = data.market_data.current_price.brl;
        cache.current[cacheKey] = rate;
        setRates(prev => ({ ...prev, [cacheKey]: rate }));
        setIsLoading(false);
        return rate;
      }
    } catch (error) {
      console.error('Error fetching historical rate:', error);
    }
    
    setIsLoading(false);
    return null;
  }, []);

  return { fetchHistoricalRate, isLoading, rates };
};