import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, calculateInvestmentReturn } from '@/utils/calculations';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, TrendingUp, TrendingDown } from '@/components/BxIcon';

const InvestmentCard = ({ investment, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const returnPercent = calculateInvestmentReturn(investment.investedAmount, investment.currentAmount);
  const isProfit = returnPercent >= 0;

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-5 border border-gray-200 dark:border-vindex-border shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex flex-col gap-1 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 rounded-full w-fit">
              {investment.type}
            </span>
            {investment.subtype && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-vindex-bg px-2 py-0.5 rounded-full w-fit">
                {investment.subtype}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg line-clamp-1">{investment.name}</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
             {t('investments.purchased_on', { date: new Date(investment.purchaseDate).toLocaleDateString(i18n.language) })}
          </p>
        </div>
        <div className="flex gap-1">
           <Button size="sm" variant="ghost" onClick={() => onEdit(investment)} className="h-8 w-8 p-0">
             <Pencil size={14} />
           </Button>
           <Button size="sm" variant="ghost" onClick={() => onDelete(investment.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
             <Trash size={14} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
         <div>
            <p className="text-xs text-gray-700 dark:text-gray-300">{t('investments.col_invested')}</p>
            <p className="font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(investment.investedAmount)}</p>
         </div>
         <div className="text-right">
            <p className="text-xs text-gray-700 dark:text-gray-300">{t('investments.col_current')}</p>
            <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(investment.currentAmount)}</p>
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
    </div>
  );
};

export default InvestmentCard;