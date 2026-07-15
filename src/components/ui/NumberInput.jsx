import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol, getCurrencyDecimals, getCurrencyLocale } from '@/utils/currencySymbolMap';

const NumberInput = ({ value, onChange, min, max, className, placeholder, id, currencyCode = 'BRL', disabled = false }) => {
  const [displayValue, setDisplayValue] = useState('');
  const decimals = getCurrencyDecimals(currencyCode);
  const symbol = getCurrencySymbol(currencyCode);
  const locale = getCurrencyLocale(currencyCode);

  const formatNumber = (val) => {
    return val.toLocaleString(locale, {
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
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none crypto-symbol">
        {symbol}
      </div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        className="h-10 w-full pl-10 pr-3 py-2 bg-background border rounded-lg outline-none hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-foreground placeholder:text-muted-foreground"
        placeholder={placeholder || formatNumber(0)}
        autoComplete="off"
      />
    </div>
  );
};

export default NumberInput;