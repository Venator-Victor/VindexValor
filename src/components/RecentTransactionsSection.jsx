import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BxIcon, { ListUl, Ghost } from '@/components/BxIcon';

const RecentTransactionsSection = ({ transactions, categories, selectedPeriod }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Transactions are already filtered by parent for the selected period
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  const getCategoryDetails = (tx) => {
    if (tx.categories) return { icon: tx.categories.icon, color: tx.categories.color, name: tx.categories.name };
    const cat = categories.find(c => c.id === tx.category_id || c.name === tx.category);
    return cat ? { icon: cat.icon, color: cat.color, name: cat.name } : { icon: 'bx bx-tag', color: '#94a3b8', name: t('common.no_category') };
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
  };

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <ListUl size={20} className="text-purple-500" />
            {t('nav.transactions')}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400">
            {t(`period.${selectedPeriod}`)}
        </span>
      </div>

      <div className="overflow-y-auto overflow-x-hidden flex-1 pr-2 -mr-2 space-y-2 custom-scrollbar">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((tx, index) => {
            const catDetails = getCategoryDetails(tx);
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                onClick={() => navigate('/transactions', { state: { editTransactionId: tx.id } })}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
                    style={{ backgroundColor: catDetails.color + '22', color: catDetails.color, borderColor: catDetails.color + '44' }}
                  >
                    <BxIcon iconClass={catDetails.icon} size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate max-w-[140px] sm:max-w-[180px]">
                      {tx.description || tx.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium opacity-80 truncate max-w-[80px]"
                        style={{ backgroundColor: catDetails.color }}
                      >
                        {catDetails.name}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-sm whitespace-nowrap pl-2 shrink-0 ${
                  tx.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : tx.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(Math.abs(tx.amount))}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-8">
            <Ghost size={40} className="mb-2" />
            <p className="text-sm">{t('dashboard.no_transactions')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactionsSection;