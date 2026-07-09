import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/calculations';
import { convertBudgetAmount } from '@/utils/budgetProration';
import { PERIOD_OPTIONS } from '@/utils/periodOptions';
import { cn } from '@/lib/utils';

// Shows what a category's budget works out to across every other period,
// so setting e.g. a monthly limit also shows the equivalent daily/weekly/etc
// amounts for reference. `period` is the category's own configured period.
const BudgetPeriodBreakdown = ({ amount, period, className }) => {
  const { t } = useTranslation();
  if (!amount || amount <= 0) return null;

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs', className)}>
      {PERIOD_OPTIONS.map((opt) => (
        <div
          key={opt.value}
          className={cn(
            'flex items-center justify-between gap-2 rounded-md px-2 py-1',
            opt.value === period
              ? 'bg-primary/10 text-primary font-semibold'
              : 'bg-gray-50 dark:bg-vindex-bg text-gray-500 dark:text-gray-400'
          )}
        >
          <span className="truncate">{t(`period.${opt.value}`)}</span>
          <span className="font-medium whitespace-nowrap">{formatCurrency(convertBudgetAmount(amount, period, opt.value))}</span>
        </div>
      ))}
    </div>
  );
};

export default BudgetPeriodBreakdown;
