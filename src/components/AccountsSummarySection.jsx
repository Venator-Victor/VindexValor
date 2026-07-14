import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrencyWithSymbol, LIABILITY_ACCOUNT_TYPES } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BxIcon, { Wallet } from '@/components/BxIcon';
import { ACCOUNT_TYPE_LABEL_KEYS } from '@/utils/accountMappings';
import { SUCCESS, DANGER } from '@/utils/colors';

// `accounts` is FinanceContext's `calculatedAccounts` — balances are already derived
// from transactions, not the raw stored column. A credit card's `balance` is NOT its
// real debt though (card purchases live in invoices, not linked transactions) — its
// actual owed amount is `current_fatura_value`, same as Accounts.jsx's own cards.
// Other debt-by-nature types (e.g. loan) can have their balance stored as a positive
// "amount owed" rather than negative — same LIABILITY_ACCOUNT_TYPES calculateAssetsLiabilities
// uses, so this card never shows a loan as a green/positive balance.
const isCreditCard = (account) => account.type === 'credit_card' || account.account_subtype === 'credit_card';
const isLiabilityAccount = (account) => LIABILITY_ACCOUNT_TYPES.includes(account.type) || LIABILITY_ACCOUNT_TYPES.includes(account.account_subtype);
const displayBalance = (account) => {
  if (isCreditCard(account)) return -(account.current_fatura_value || 0);
  if (isLiabilityAccount(account)) return -Math.abs(account.balance || 0);
  return account.balance || 0;
};

const AccountsSummarySection = ({ accounts = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => Math.abs(displayBalance(b)) - Math.abs(displayBalance(a))),
    [accounts]
  );

  const getAccountTypeLabel = (type) => t(ACCOUNT_TYPE_LABEL_KEYS[type] || type);

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <Wallet size={20} className="text-teal-500" />
            {t('nav.accounts')}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400">
            {t('accounts.count_label', { count: accounts.length })}
        </span>
      </div>

      <div className="overflow-y-auto overflow-x-hidden flex-1 pr-2 -mr-2 space-y-2 custom-scrollbar">
        {sortedAccounts.length > 0 ? (
          sortedAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              onClick={() => navigate('/accounts')}
              className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: (account.color || '#94a3b8') + '22', color: account.color || '#94a3b8', borderColor: (account.color || '#94a3b8') + '44' }}
                >
                  <BxIcon iconClass={`bx ${account.icon || 'bx-wallet'}`} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate max-w-[140px] sm:max-w-[180px]">
                    {account.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium opacity-80 truncate max-w-[100px]" style={{ backgroundColor: account.color || '#94a3b8' }}>
                      {getAccountTypeLabel(account.type)}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="font-bold text-sm whitespace-nowrap pl-2 shrink-0 crypto-symbol"
                style={{ color: displayBalance(account) >= 0 ? SUCCESS : DANGER }}
              >
                {formatCurrencyWithSymbol(displayBalance(account), account.currency)}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-8">
            <Wallet size={40} className="mb-2" />
            <p className="text-sm">{t('accounts.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsSummarySection;
