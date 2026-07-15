import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, calculateInvestmentReturn } from '@/utils/calculations';
import { PieChart, TrendingUp, TrendingDown, Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import { PRIMARY, DANGER } from '@/utils/colors';

const InvestmentDetailModal = ({ isOpen, onClose, investment, accounts, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();

  if (!investment) return null;

  const returnPercent = calculateInvestmentReturn(investment.investedAmount, investment.currentAmount);
  const isProfit = returnPercent >= 0;
  const profitColor = isProfit ? '#10b981' : '#ef4444';
  const fundingAccount = accounts?.find(acc => acc.id === investment.accountId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
            style={{ backgroundColor: profitColor + '22', borderColor: profitColor + '44' }}
          >
            <PieChart size={24} style={{ color: profitColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-bold break-words" title={investment.name}>
              {investment.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {investment.subtype ? `${investment.type} · ${investment.subtype}` : investment.type}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 p-3 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-1">{t('investments.col_invested')}</p>
            <p className="text-lg font-bold crypto-symbol">{formatCurrency(investment.investedAmount)}</p>
          </div>
          <div className={`p-3 rounded-lg border ${isProfit ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'}`}>
            <p className={`text-xs mb-1 ${isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {t('investments.col_current')}
            </p>
            <p className={`text-lg font-bold crypto-symbol ${isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {formatCurrency(investment.currentAmount)}
            </p>
          </div>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg ${isProfit ? 'bg-green-50 dark:bg-vindex-success/10' : 'bg-red-50 dark:bg-vindex-danger/10'}`}>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('investments.col_return')}</span>
          <div className="flex items-center gap-1">
            {isProfit ? <TrendingUp size={16} className="text-green-600 dark:text-vindex-success" /> : <TrendingDown size={16} className="text-red-600 dark:text-vindex-danger" />}
            <span className={`font-bold ${isProfit ? 'text-green-600 dark:text-vindex-success' : 'text-red-600 dark:text-vindex-danger'}`}>
              {isProfit ? '+' : ''}{returnPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{t('investments.purchase_date')}</p>
            <span className="text-sm font-medium truncate block">
              {new Date(investment.purchaseDate).toLocaleDateString(i18n.language)}
            </span>
          </div>
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{t('common.account')}</p>
            <span className="text-sm font-medium truncate block">{fundingAccount?.name || '-'}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onClose(); onEdit(investment); }}
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
              onClick={() => onDelete(investment.id)}
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

export default InvestmentDetailModal;
