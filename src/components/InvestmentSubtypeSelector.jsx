import React from 'react';
import SelectInput from '@/components/ui/SelectInput';
import { getSubtypeOptions, INVESTMENT_TYPES } from '@/utils/investmentTypes';

const InvestmentSubtypeSelector = ({ type, value, onChange, className }) => {
  // If no type is selected, or if the type is 'Fundo', don't render anything (or render empty depending on UX preference)
  // Requirement says: "Only show subtypes for Renda Fixa and Renda Variável (Fundo has no subtypes)"
  if (!type || type === INVESTMENT_TYPES.FUNDO) {
    return null;
  }

  const options = getSubtypeOptions(type);

  if (options.length === 0) return null;

  return (
    <div className={`animate-in fade-in slide-in-from-top-1 ${className}`}>
      <SelectInput
        label="Subtipo"
        id="investment_subtype"
        value={value}
        options={options}
        onChange={onChange}
        placeholder="Selecione o subtipo"
      />
    </div>
  );
};

export default InvestmentSubtypeSelector;