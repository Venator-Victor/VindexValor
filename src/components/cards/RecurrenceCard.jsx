import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/calculations';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { Repeat, Check, Checks } from '@/components/BxIcon';
import { PRIMARY, SUCCESS, DANGER } from '@/utils/colors';

const RecurrenceCard = ({ item, onClick, onToggleStatus }) => {
  const { t, i18n } = useTranslation();
  const { parcels, payParcel } = useFinance();
  const isActive = item.status === 'active';
  const isParceled = item.recurrence_type === 'installments';
  const isIncome = Number(item.amount) > 0;
  const typeColor = isIncome ? SUCCESS : DANGER;

  // Find related parcels for this recurring item
  const safeParcels = Array.isArray(parcels) ? parcels : [];
  const itemParcels = safeParcels.filter(p => p.recurring_item_id === item.id).sort((a, b) => a.parcel_number - b.parcel_number);

  // Calculate parcel progress
  const paidParcelsCount = itemParcels.filter(p => p.paid_date).length;
  const totalParcelsCount = item.installment_count || 0;
  const nextPendingParcel = itemParcels.find(p => !p.paid_date);
  const progressPercent = totalParcelsCount > 0 ? Math.round((paidParcelsCount / totalParcelsCount) * 100) : 0;

  const handlePayNextParcel = (e) => {
    e.stopPropagation();
    if (nextPendingParcel) {
      payParcel(nextPendingParcel.id);
    }
  };

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    onToggleStatus(item);
  };

  // Safe access to category name from joined data
  const categoryName = item.categories?.name || t('common.no_category');

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className={`bg-white dark:bg-vindex-card rounded-xl p-4 border transition-shadow shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer ${isActive ? 'border-gray-200 dark:border-vindex-border' : 'border-gray-100 dark:border-vindex-border/30 opacity-80'}`}
      onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
      onMouseLeave={e => e.currentTarget.style.borderColor = ''}
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border shrink-0"
            style={{ backgroundColor: typeColor + '22', borderColor: typeColor + '44' }}
          >
            <Repeat size={20} style={{ color: typeColor }} />
          </div>
          <div className="text-left flex-grow overflow-hidden">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 leading-tight break-words" title={item.description}>{item.description}</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
              {t(`recurrences.type_${item.recurrence_type || 'subscription'}`)} · {categoryName}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-700 dark:text-gray-300 mt-3">
        {isParceled
          ? t('recurrences.parcel_of', { current: nextPendingParcel ? nextPendingParcel.parcel_number : totalParcelsCount, total: totalParcelsCount })
          : `${t('recurrences.next_label')}: ${item.next_date ? new Date(item.next_date).toLocaleDateString(i18n.language) : '—'}`}
      </p>

      <div className="w-full p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-100 dark:border-vindex-border flex items-center justify-between mt-3">
        <div className="text-left">
          <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('common.amount')}</span>
          <span className="text-lg font-bold block" style={{ color: typeColor }}>{formatCurrency(item.amount)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('common.frequency')}</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-50 block">{t(`period.${item.frequency}`, item.frequency)}</span>
        </div>
      </div>

      {isParceled ? (
        <>
          <div className="p-3 rounded-lg mt-3 bg-blue-50 dark:bg-blue-900/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('recurrences.progress_label')}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-white/70 dark:bg-vindex-bg h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {nextPendingParcel && (
            <Button
              size="sm"
              onClick={handlePayNextParcel}
              className="w-full mt-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 h-9"
            >
              <Check size={14} className="mr-1.5" /> {t('recurrences.pay_parcel', { number: nextPendingParcel.parcel_number })}
            </Button>
          )}

          {!nextPendingParcel && paidParcelsCount === totalParcelsCount && totalParcelsCount > 0 && (
            <div
              className="w-full text-center text-xs font-bold py-2 mt-3 rounded-lg border"
              style={{ color: SUCCESS, backgroundColor: SUCCESS + '1A', borderColor: SUCCESS + '44' }}
            >
              <Checks size={14} className="mr-1 inline" /> {t('recurrences.paid_off')}
            </div>
          )}
        </>
      ) : (
        <div
          className={`flex items-center justify-between p-3 rounded-lg mt-3 ${isActive ? '' : 'bg-gray-50 dark:bg-vindex-bg'}`}
          style={isActive ? { backgroundColor: SUCCESS + '1A' } : undefined}
        >
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('recurrences.col_status')}</span>
          <button
            onClick={handleToggleStatus}
            className="font-bold text-sm hover:underline"
            style={{ color: isActive ? SUCCESS : undefined }}
          >
            {isActive ? t('recurrences.status_active') : t('recurrences.status_inactive')}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecurrenceCard;
