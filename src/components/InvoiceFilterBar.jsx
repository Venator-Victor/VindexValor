import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X } from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import SelectInput from '@/components/ui/SelectInput';
import FilterRangeInput from './FilterRangeInput';
import { useFinance } from '@/context/FinanceContext';
import InfoTooltip from './InfoTooltip';
import { buildFlatIndentedOptions } from '@/utils/categoryTree';

const InvoiceFilterBar = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const { categories, accounts } = useFinance();
  
  const [filters, setFilters] = useState({
    search: '',
    valorRange: '',
    category_id: '',
    installment: 'todos',
    account_id: ''
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const cleared = {
      search: '',
      valorRange: '',
      category_id: '',
      installment: 'todos',
      account_id: ''
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'installment') return v !== 'todos';
    if (k === 'valorRange') return v.trim() !== '';
    return v !== '';
  }).length;

  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Filter className="w-4 h-4" />
          {t('common.advanced_filters')}

          <InfoTooltip content={
            <div className="space-y-1 text-sm">
              <p><strong>{t('common.amount')}:</strong> {t('common.filter_value_hint')}</p>
              <p><strong>{t('common.description')}:</strong> {t('common.filter_desc_hint')}</p>
            </div>
          } />

          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-2">
              {t('common.active_filters_count', { count: activeCount })}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-xs text-muted-foreground hover:text-foreground">
            {t('common.clear_filters')} <X className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative flex flex-col lg:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('common.search_placeholder')}
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm text-foreground hover:border-primary focus:border-primary outline-none h-[42px]"
            />
          </div>
        </div>

        {/* Value Range String Filter */}
        <div className="lg:col-span-1">
          <FilterRangeInput
            value={filters.valorRange}
            onChange={(val) => handleChange('valorRange', val)}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col lg:col-span-1">
          <SelectInput
            value={filters.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            options={[
              { label: t('transactions.all_categories'), value: "" },
              ...buildFlatIndentedOptions(categories)
            ]}
            className="h-[42px]"
          />
        </div>

        {/* Parcelamento */}
        <div className="flex flex-col lg:col-span-1">
          <SelectInput
            value={filters.installment}
            onChange={(e) => handleChange('installment', e.target.value)}
            options={[
              { label: t('invoices.filter_installment_all'), value: "todos" },
              { label: t('invoices.filter_installment_only'), value: "installment" },
              { label: t('invoices.filter_installment_none'), value: "not_installment" }
            ]}
            className="h-[42px]"
          />
        </div>

        {/* Account */}
        <div className="flex flex-col lg:col-span-1">
          <SelectInput
            value={filters.account_id}
            onChange={(e) => handleChange('account_id', e.target.value)}
            options={[
              { label: t('invoices.filter_all_accounts'), value: "" },
              ...accounts.map(a => ({ label: a.name, value: a.id }))
            ]}
            className="h-[42px]"
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilterBar;