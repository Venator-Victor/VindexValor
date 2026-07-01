import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarDays } from '@/components/BxIcon';
import { CHART_PERIOD_OPTIONS } from '@/utils/periodOptions';

const DashboardPeriodSelector = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-2">
        <CalendarDays className="w-4 h-4" />
        <span>{t('dashboard.period_label')}</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border">
          <SelectValue placeholder={t('period.select_period')} />
        </SelectTrigger>
        <SelectContent>
          {CHART_PERIOD_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {t(`period.${opt.value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DashboardPeriodSelector;