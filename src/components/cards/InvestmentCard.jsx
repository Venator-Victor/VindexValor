import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, calculateInvestmentReturn } from '@/utils/calculations';
import { PieChart, TrendingUp, TrendingDown } from '@/components/BxIcon';
import { PRIMARY } from '@/utils/colors';

const InvestmentCard = ({ investment, onClick }) => {
  const { t, i18n } = useTranslation();
  const returnPercent = calculateInvestmentReturn(investment.investedAmount, investment.currentAmount);
  const isProfit = returnPercent >= 0;
  const profitColor = isProfit ? '#10b981' : '#ef4444';

  return (
    <div
      onClick={() => onClick && onClick(investment)}
      className="bg-white dark:bg-vindex-card rounded-xl p-4 border border-gray-200 dark:border-vindex-border transition-shadow shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
      onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
      onMouseLeave={e => e.currentTarget.style.borderColor = ''}
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border shrink-0"
            style={{ backgroundColor: profitColor + '22', borderColor: profitColor + '44' }}
          >
            <PieChart size={20} style={{ color: profitColor }} />
          </div>
          <div className="text-left flex-grow overflow-hidden">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 leading-tight break-words" title={investment.name}>{investment.name}</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
              {investment.subtype ? `${investment.type} · ${investment.subtype}` : investment.type}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-700 dark:text-gray-300 mt-3">
        {t('investments.purchased_on', { date: new Date(investment.purchaseDate).toLocaleDateString(i18n.language) })}
      </p>

      <div className="w-full p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-100 dark:border-vindex-border flex items-center justify-between mt-3">
        <div className="text-left">
          <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('investments.col_current')}</span>
          <span className="text-lg font-bold crypto-symbol block" style={{ color: profitColor }}>
            {formatCurrency(investment.currentAmount)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('investments.col_invested')}</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-50 crypto-symbol block">
            {formatCurrency(investment.investedAmount)}
          </span>
        </div>
      </div>

      <div className={`flex items-center justify-between p-3 rounded-lg mt-3 ${isProfit ? 'bg-green-50 dark:bg-vindex-success/10' : 'bg-red-50 dark:bg-vindex-danger/10'}`}>
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
