import React, { useState } from 'react';
import { Search } from '@/components/BxIcon';
export const parseValueFilterString = (input) => {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return { isValid: true, conditions: [] };
  }
  
  const parts = input.split(';');
  const conditions = [];
  const errors = [];
  
  for (const p of parts) {
    const str = p.trim();
    if (!str) continue;
    // Match operators: >=, <=, >, <, =, or empty (defaults to =) followed by a number
    const match = str.match(/^(>=|<=|>|<|=)?\s*(\d+(?:\.\d+)?)$/);
    
    if (!match) {
      errors.push(`Inválido: "${str}"`);
      continue;
    }
    
    conditions.push({ 
      op: match[1] || '=', 
      val: Number(match[2]) 
    });
  }
  
  return { isValid: errors.length === 0, conditions, errors };
};

const FilterRangeInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value || '');
  const [error, setError] = useState('');

  // Sync local editable copy when the `value` prop changes (adjust state during render, per React docs).
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setLocalVal(value || '');
  }

  const handleBlur = () => {
    const parsed = parseValueFilterString(localVal);
    if (!parsed.isValid) {
      setError(parsed.errors.join(', '));
    } else {
      setError('');
      onChange(localVal);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className="w-full relative pb-4 -mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder=">100;<1000 ou =50"
          value={localVal}
          onChange={(e) => {
            setLocalVal(e.target.value);
            if (error) setError('');
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm text-foreground hover:border-primary focus:border-primary outline-none h-[42px] transition-colors ${
            error ? 'border-destructive focus:ring-destructive' : 'border-input'
          }`}
          title="Operadores suportados: >, <, >=, <=, = separando por ;"
        />
      </div>
      {error && (
        <span className="text-[10px] text-destructive absolute bottom-0 left-0 w-full truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
};

export default FilterRangeInput;