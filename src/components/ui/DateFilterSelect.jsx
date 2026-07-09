import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Calendar as CalendarIcon } from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/DatePicker';
import { cn } from '@/lib/utils';

const YEARS_BACK = 10;

// Types that apply immediately on click, no extra input needed.
const SIMPLE_TYPES = ['', 'last_week', 'last_month', 'last_year'];

// Shared date-range filter for the Transactions and Invoices pages. Renders
// as a single trigger button + floating panel (like SelectInput/DatePicker's
// own dropdowns) so picking a month/year/custom range never pushes page
// content around.
const DateFilterSelect = ({ value, onChange, className = '' }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const containerRef = useRef(null);

  const openPanel = () => {
    setDraft(value);
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleDateString(i18n.language, { month: 'long' }),
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_BACK + 1 }, (_, i) => currentYear - i);

  const typeOptions = [
    { label: t('common.date_filter_all'), value: '' },
    { label: t('common.date_filter_last_week'), value: 'last_week' },
    { label: t('common.date_filter_last_month'), value: 'last_month' },
    { label: t('common.date_filter_last_year'), value: 'last_year' },
    { label: t('common.date_filter_month'), value: 'month' },
    { label: t('common.date_filter_year'), value: 'year' },
    { label: t('common.date_filter_period'), value: 'period' },
  ];

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(i18n.language);
  };

  const triggerLabel = () => {
    switch (value.type) {
      case 'month':
        return `${months.find((m) => m.value === value.month)?.label ?? ''} ${value.year}`;
      case 'year':
        return String(value.year);
      case 'period':
        if (value.startDate || value.endDate) {
          return `${formatDate(value.startDate) || '…'} - ${formatDate(value.endDate) || '…'}`;
        }
        return t('common.date_filter_period');
      default:
        return typeOptions.find((o) => o.value === value.type)?.label ?? t('common.date_filter_all');
    }
  };

  const handleSelectType = (type) => {
    if (SIMPLE_TYPES.includes(type)) {
      onChange({ ...draft, type });
      setIsOpen(false);
    } else {
      setDraft((prev) => ({ ...prev, type }));
    }
  };

  const handleApply = () => {
    onChange(draft);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setIsOpen(false);
  };

  const needsExtraFields = draft.type === 'month' || draft.type === 'year' || draft.type === 'period';

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openPanel())}
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg border px-3 h-[42px] text-sm transition-all outline-none',
          'bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text',
          'hover:border-primary focus:border-primary w-40 sm:w-48'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-vindex-text/50 shrink-0" />
          <span className="truncate">{triggerLabel()}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform duration-200 shrink-0', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-72 rounded-lg border border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-card py-1 shadow-xl"
          >
            {typeOptions.map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => handleSelectType(option.value)}
                className={cn(
                  'relative flex w-full items-center rounded-sm py-2 pl-3 pr-9 text-sm outline-none transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-vindex-bg/50 text-gray-900 dark:text-vindex-text',
                  draft.type === option.value && 'bg-primary/10 text-primary font-medium'
                )}
              >
                <span className="truncate">{option.label}</span>
                {draft.type === option.value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}

            {needsExtraFields && (
              <div className="border-t border-gray-200 dark:border-vindex-border mt-1 p-3 space-y-3">
                {draft.type === 'month' && (
                  <div className="flex gap-2">
                    <select
                      value={draft.month}
                      onChange={(e) => setDraft({ ...draft, month: Number(e.target.value) })}
                      className="flex-1 rounded-lg border px-2 py-2 text-sm bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text outline-none hover:border-primary focus:border-primary"
                    >
                      {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                      value={draft.year}
                      onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })}
                      className="w-24 rounded-lg border px-2 py-2 text-sm bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text outline-none hover:border-primary focus:border-primary"
                    >
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}

                {draft.type === 'year' && (
                  <select
                    value={draft.year}
                    onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })}
                    className="w-full rounded-lg border px-2 py-2 text-sm bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text outline-none hover:border-primary focus:border-primary"
                  >
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}

                {draft.type === 'period' && (
                  <div className="space-y-2">
                    <DatePicker
                      label={t('common.date_from')}
                      value={draft.startDate}
                      onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                    />
                    <DatePicker
                      label={t('common.date_to')}
                      value={draft.endDate}
                      onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" className="flex-1" onClick={handleApply}>
                    {t('common.confirm')}
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="flex-1" onClick={handleCancel}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateFilterSelect;
