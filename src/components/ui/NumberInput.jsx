import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol, getCurrencyDecimals } from '@/utils/currencySymbolMap';

const NumberInput = ({ value, onChange, min, max, className, placeholder, id, currencyCode = 'BRL' }) => {
  const [displayValue, setDisplayValue] = useState('');
  const decimals = getCurrencyDecimals(currencyCode);
  const symbol = getCurrencySymbol(currencyCode);

  const formatNumber = (val) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Sync the formatted display value when `value`/`currencyCode` change (adjust state during render, per React docs).
  const syncKey = `${value}|${currencyCode}`;
  const [syncedKey, setSyncedKey] = useState(null);
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    if (value === '' || value === undefined || value === null) {
      setDisplayValue('');
    } else {
      const numberVal = Number(value);
      if (!isNaN(numberVal)) {
        setDisplayValue(formatNumber(numberVal));
      }
    }
  }

  const handleChange = (e) => {
    let inputValue = e.target.value;

    const digits = inputValue.replace(/\D/g, '');

    if (digits === '') {
      onChange({ target: { value: '', id, name: id } });
      setDisplayValue('');
      return;
    }

    const divisor = Math.pow(10, decimals);
    const numberValue = parseInt(digits, 10) / divisor;

    if (max !== undefined && numberValue > max) return;
    if (min !== undefined && numberValue < min) return; 

    onChange({ target: { value: numberValue, id, name: id } });
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-vindex-text/50 pointer-events-none crypto-symbol">
        {symbol}
      </div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vindex-success disabled:cursor-not-allowed disabled:opacity-50 dark:border-vindex-border dark:bg-vindex-bg dark:ring-offset-gray-950 dark:placeholder:text-vindex-text/30 dark:focus-visible:ring-vindex-success text-gray-900 dark:text-vindex-text"
        placeholder={placeholder || `0,${'0'.repeat(decimals)}`}
        autoComplete="off"
      />
    </div>
  );
};

export default NumberInput;