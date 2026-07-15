import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculations';
import { Repeat, Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import { PRIMARY, SUCCESS, DANGER, successAlpha } from '@/utils/colors';

const RecurrenceDetailModal = ({ isOpen, onClose, item, onEdit, onDelete, onToggleStatus }) => {
  const { t, i18n } = useTranslation();

  if (!item) return null;

  const isIncome = Number(item.amount) > 0;
  const typeColor = isIncome ? SUCCESS : DANGER;
  const isActive = item.status === 'active';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
            style={{ backgroundColor: (item.categories?.color || typeColor) + '22', borderColor: (item.categories?.color || typeColor) + '44' }}
          >
            <Repeat size={24} style={{ color: item.categories?.color || typeColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-bold break-words" title={item.description}>
              {item.description}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t(`recurrences.type_${item.recurrence_type || 'subscription'}`)}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('common.amount')}</p>
          <p className="text-3xl font-bold crypto-symbol" style={{ color: typeColor }}>
            {formatCurrency(item.amount)}
          </p>
          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: typeColor + '22', color: typeColor }}>
            {t(`period.${item.frequency}`, item.frequency)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{t('common.category')}</p>
            {item.categories ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.categories.color }} />
                <span className="text-sm font-medium truncate">{item.categories.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{t('common.no_category')}</span>
            )}
          </div>
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{t('recurrences.col_next_billing')}</p>
            <span className="text-sm font-medium truncate block">
              {item.date || item.next_date ? new Date(item.date || item.next_date).toLocaleDateString(i18n.language) : 'N/A'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onToggleStatus(item)}
          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border font-medium ${
            isActive
              ? ''
              : 'bg-gray-50 border-gray-200 dark:bg-vindex-bg/50 dark:border-vindex-border/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-vindex-border'
          }`}
          style={isActive ? { backgroundColor: successAlpha(0.1), borderColor: successAlpha(0.3), color: SUCCESS } : undefined}
        >
          {isActive ? t('recurrences.status_active') : t('recurrences.status_inactive')}
        </button>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onClose(); onEdit(item); }}
            className="flex-1 gap-1"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            {t('common.edit')}
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(item.id)}
              className="flex-1 gap-1"
              style={{ borderColor: DANGER, color: DANGER }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurrenceDetailModal;
