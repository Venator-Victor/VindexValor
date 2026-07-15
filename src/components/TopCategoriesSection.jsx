import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BxIcon, { PieChartAlt2, BarChart } from '@/components/BxIcon';
import { getDateFilterLabel } from '@/utils/dateFilter';
import CircularProgressBar from '@/components/CircularProgressBar';

const TopCategoriesSection = ({ transactions, categories, dateFilter }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const categoryStats = useMemo(() => {
    const expenses = transactions.filter(tx => tx.type === 'expense');
    const totalExpenses = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);

    const stats = {};

    expenses.forEach(tx => {
      const catName = tx.categories?.name || t('dashboard.uncategorized_label');
      if (!stats[catName]) {
        stats[catName] = {
          id: tx.category_id,
          amount: 0,
          color: tx.categories?.color || '#94a3b8',
          icon: tx.categories?.icon || 'bx-purchase-tag'
        };
      }
      stats[catName].amount += Math.abs(Number(tx.amount));
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        id: data.id,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        color: data.color,
        icon: data.icon
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); 
  }, [transactions]);

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <PieChartAlt2 size={20} className="text-blue-500" />
            {t('nav.categories')}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400">
            {getDateFilterLabel(dateFilter, t, i18n)}
        </span>
      </div>

      <div className="overflow-y-auto overflow-x-hidden flex-1 pr-2 -mr-2 space-y-2 custom-scrollbar">
        {categoryStats.length > 0 ? (
          categoryStats.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate('/transactions', { state: { filterCategoryId: cat.id || 'null' } })}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 shrink-0 w-[112px] sm:w-[152px]">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
                    style={{ backgroundColor: cat.color + '22', color: cat.color, borderColor: cat.color + '44' }}
                  >
                    <BxIcon iconClass={cat.icon} size={18} />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate" title={cat.name}>
                    {cat.name}
                  </p>
                </div>
                <div className="shrink-0">
                  <CircularProgressBar current={cat.percentage} max={100} size={36} strokeWidth={3} showBudget={false} color={cat.color} />
                </div>
                <span className="text-right ml-auto shrink-0 pl-2 font-bold text-gray-900 dark:text-gray-50 text-sm whitespace-nowrap">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-8">
            <BarChart size={40} className="mb-2" />
            <p className="text-sm">{t('dashboard.no_data_this_period')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopCategoriesSection;