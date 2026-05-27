import React from 'react';
import { formatCurrencyValue } from '@/utils/currencyUtils';

const CurrencySymbol = ({ currency = 'BRL', value, className = '' }) => {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      {formatCurrencyValue(value, currency)}
    </span>
  );
};

export default CurrencySymbol;