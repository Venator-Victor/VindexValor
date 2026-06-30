import { useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrencyWithSymbol } from '@/utils/calculations';

export const useCurrencyFormatter = () => {
  const { settings } = useFinance();
  const currency = settings?.currency || 'BRL';
  return useCallback((value) => formatCurrencyWithSymbol(value, currency), [currency]);
};