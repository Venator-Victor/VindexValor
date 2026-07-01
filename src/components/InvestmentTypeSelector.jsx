import React from 'react';
import { useTranslation } from 'react-i18next';
import SelectInput from '@/components/ui/SelectInput';
import { getTypeOptions } from '@/utils/investmentTypes';

const InvestmentTypeSelector = ({ value, onChange, className }) => {
  const { t } = useTranslation();
  const options = getTypeOptions();

  return (
    <div className={className}>
      <SelectInput
        label={t('investments.type_label')}
        id="investment_type"
        value={value}
        options={options}
        onChange={onChange}
        placeholder={t('investments.type_placeholder')}
      />
    </div>
  );
};

export default InvestmentTypeSelector;