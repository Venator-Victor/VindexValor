import React from 'react';
import SelectInput from '@/components/ui/SelectInput';
import { getTypeOptions } from '@/utils/investmentTypes';

const InvestmentTypeSelector = ({ value, onChange, className }) => {
  const options = getTypeOptions();

  return (
    <div className={className}>
      <SelectInput
        label="Tipo de Investimento"
        id="investment_type"
        value={value}
        options={options}
        onChange={onChange}
        placeholder="Selecione o tipo"
      />
    </div>
  );
};

export default InvestmentTypeSelector;