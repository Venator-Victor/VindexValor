import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculations';
import BxIcon, { Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import { PRIMARY, DANGER, SUCCESS } from '@/utils/colors';

const InvoiceItemDetailModal = ({ isOpen, onClose, item, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();

  if (!item) return null;

  const isExpense = Number(item.amount) < 0;
  const typeColor = isExpense ? DANGER : SUCCESS;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
            style={{ backgroundColor: (item.categories?.color || typeColor) + '22', borderColor: (item.categories?.color || typeColor) + '44' }}
          >
            <BxIcon
              iconClass={item.categories?.icon || 'bx bx-cart'}
              size={24}
              style={{ color: item.categories?.color || typeColor }}
            />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold break-words" title={item.description}>
              {item.description}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(item.date).toLocaleDateString(i18n.language, { timeZone: 'UTC' })}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('common.amount')}</p>
          <p className="text-3xl font-bold crypto-symbol" style={{ color: typeColor }}>
            {isExpense ? '-' : '+'}{formatCurrency(Math.abs(item.amount))}
          </p>
          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: typeColor + '22', color: typeColor }}>
            {isExpense ? t('transactions.type_expense') : t('transactions.type_income')}
          </span>
        </div>

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

        {item.is_installment && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg">
            {t('invoices.parcel_label', { number: item.parcel_number, total: item.total_parcels })}
          </div>
        )}

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

export default InvoiceItemDetailModal;
