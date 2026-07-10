import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrencyWithSymbol } from '@/utils/calculations';
import BxIcon, { Edit as Edit2, TrashAlt as Trash2, History, ArrowRight } from '@/components/BxIcon';
import { PRIMARY, DANGER } from '@/utils/colors';

const TYPE_COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  payment: '#ef4444',
  transfer: PRIMARY,
};

const TransactionDetailModal = ({ isOpen, onClose, transaction, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();

  if (!transaction) return null;

  const typeColor = TYPE_COLORS[transaction.type] || PRIMARY;
  const isOutgoing = transaction.type === 'expense' || transaction.type === 'payment' || transaction.type === 'transfer';
  const isTransfer = transaction.type === 'transfer';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card text-foreground max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
            style={{ backgroundColor: (transaction.categories?.color || typeColor) + '22', borderColor: (transaction.categories?.color || typeColor) + '44' }}
          >
            <BxIcon
              iconClass={transaction.categories?.icon || 'bx bx-wallet'}
              size={24}
              style={{ color: transaction.categories?.color || typeColor }}
            />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold truncate" title={transaction.description || transaction.name}>
              {transaction.description || transaction.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(transaction.date).toLocaleDateString(i18n.language, { timeZone: 'UTC' })}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('common.amount')}</p>
          <p className="text-3xl font-bold crypto-symbol" style={{ color: typeColor }}>
            {isOutgoing ? '-' : '+'}{formatCurrencyWithSymbol(Math.abs(transaction.amount), transaction.account?.currency || 'BRL')}
          </p>
          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: typeColor + '22', color: typeColor }}>
            {t(`transactions.type_${transaction.type}`)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          {isTransfer ? (
            <div className="bg-muted/20 p-3 rounded-lg border border-border/50 col-span-2 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{t('common.account')}</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="truncate">{transaction.account?.name || 'N/A'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{transaction.destination_account?.name || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{t('common.category')}</p>
                {transaction.categories ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: transaction.categories.color }} />
                    <span className="text-sm font-medium truncate">{transaction.categories.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t('common.no_category')}</span>
                )}
              </div>
              <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{t('common.account')}</p>
                <span className="text-sm font-medium truncate block">{transaction.account?.name || 'N/A'}</span>
              </div>
            </>
          )}

          {transaction.invoices?.invoice_number && (
            <div className="bg-muted/20 p-3 rounded-lg border border-border/50 col-span-2 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{t('invoices.col_invoice')}</p>
              <span className="text-sm font-medium truncate block">{transaction.invoices.invoice_number}</span>
            </div>
          )}
        </div>

        {transaction.is_recurring && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg">
            <History size={14} />
            {t('transactions.recurring_transaction_title')}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onClose(); onEdit(transaction); }}
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
              onClick={() => onDelete(transaction.id)}
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

export default TransactionDetailModal;