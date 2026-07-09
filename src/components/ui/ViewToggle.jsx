import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid as LayoutGrid, ListUl as ListIcon } from '@/components/BxIcon';
import { cn } from '@/lib/utils';

// List/card view switcher. Fixed at h-10 (with h-8 inner buttons) so it always
// matches the height of the "add new" Button (default size) it sits next to.
const ViewToggle = ({ value, onChange, className }) => {
  const { t } = useTranslation();

  const buttonClass = (isActive) => cn(
    'h-8 w-8 flex items-center justify-center rounded-md transition-all',
    isActive
      ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm'
      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
  );

  return (
    <div className={cn('flex items-center h-10 bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1', className)}>
      <button type="button" onClick={() => onChange('list')} title={t('common.view_list')} className={buttonClass(value === 'list')}>
        <ListIcon size={20} />
      </button>
      <button type="button" onClick={() => onChange('card')} title={t('common.view_card')} className={buttonClass(value === 'card')}>
        <LayoutGrid size={20} />
      </button>
    </div>
  );
};

export default ViewToggle;
