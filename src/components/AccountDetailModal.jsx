import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrencyWithSymbol } from '@/utils/calculations';
import BxIcon, { Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import { PRIMARY, DANGER } from '@/utils/colors';
import { ACCOUNT_TYPE_LABEL_KEYS } from '@/utils/accountMappings';

const AccountDetailModal = ({ isOpen, onClose, account, transactions, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();

  const accountTransactions = useMemo(() => {
    if (!account || !transactions) return [];
    return transactions
      .filter(tr => tr.account_id === account.id || tr.destination_account_id === account.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [account, transactions]);

  if (!account) return null;

  const isCreditCard = account.type === 'Cartão de Crédito' || account.account_subtype === 'credit_card';
  const getAccountTypeLabel = (type) => t(ACCOUNT_TYPE_LABEL_KEYS[type] || type);
  const typeLabel = account.type === 'Criptomoeda' && account.currency
    ? `${getAccountTypeLabel(account.type)} (${account.currency})`
    : getAccountTypeLabel(account.type);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b border-border pb-4 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: account.color + '22', borderColor: account.color + '44' }}
              >
                <BxIcon iconClass={`bx ${account.icon || 'bx-wallet'}`} size={24} style={{ color: account.color }} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {account.name} {account.currency && `(${account.currency})`}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {typeLabel}{account.bank ? ` · ${account.bank}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {isCreditCard ? (
              <>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                  <p className="text-xs text-red-700 dark:text-red-400 mb-1">{t('accounts.current_invoice')}</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400 crypto-symbol">
                    {formatCurrencyWithSymbol(account.current_fatura_value || 0, account.currency)}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{t('accounts.available_limit_full')}</p>
                  <p className="text-lg font-bold crypto-symbol">
                    {formatCurrencyWithSymbol(account.available_limit || 0, account.currency)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className={`p-3 rounded-lg border ${account.balance >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'}`}>
                  <p className={`text-xs mb-1 ${account.balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {t('accounts.current_balance')}
                  </p>
                  <p className={`text-lg font-bold crypto-symbol ${account.balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {formatCurrencyWithSymbol(account.balance, account.currency)}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{t('accounts.initial_balance')}</p>
                  <p className="text-lg font-bold crypto-symbol">
                    {formatCurrencyWithSymbol(account.initial_balance, account.currency)}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onClose(); onEdit(account); }}
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
                onClick={() => onDelete(account.id)}
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
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <h4 className="text-sm font-bold text-foreground mb-3 sticky top-0 bg-card py-2">
            {t('accounts.transaction_history')}
          </h4>

          <div className="space-y-2">
            {accountTransactions.length > 0 ? (
              accountTransactions.map((tr) => {
                const isOutgoing = tr.type === 'expense' || tr.type === 'payment' || (tr.type === 'transfer' && tr.account_id === account.id);
                return (
                  <div key={tr.id} className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/50 rounded-lg border border-border/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate pr-2">
                        {tr.description || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tr.date).toLocaleDateString(i18n.language, { timeZone: 'UTC' })}
                      </p>
                    </div>
                    <div
                      className="font-bold text-sm whitespace-nowrap pl-2 crypto-symbol"
                      style={{ color: isOutgoing ? '#ef4444' : '#10b981' }}
                    >
                      {isOutgoing ? '-' : '+'}{formatCurrencyWithSymbol(Math.abs(tr.amount), account.currency)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">{t('accounts.no_transactions')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDetailModal;