import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import {
  calculateTotalInvestmentValue,
  formatCurrencyWithSymbol,
  calculateAssetsLiabilities
} from '@/utils/calculations';
import { DANGER } from '@/utils/colors';

import InfoTooltip from '@/components/InfoTooltip';
import { Wallet, TrendingDown, TrendingUp } from '@/components/BxIcon';
import BudgetConsumptionChart from '@/components/BudgetConsumptionChart';
import AssetLiabilityChart from '@/components/AssetLiabilityChart';
import DateFilterSelect from '@/components/ui/DateFilterSelect';
import TopCategoriesSection from '@/components/TopCategoriesSection';
import RecentTransactionsSection from '@/components/RecentTransactionsSection';
import UpcomingRecurrencesSection from '@/components/UpcomingRecurrencesSection';
import AccountsSummarySection from '@/components/AccountsSummarySection';
import AssetCompositionChart from '@/components/AssetCompositionChart';
import IncomeVsInflationChart from '@/components/IncomeVsInflationChart';
import BetaWarningModal from '@/components/BetaWarningModal';
import useBetaWarning from '@/hooks/useBetaWarning';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { useTheme } from '@/context/ThemeContext';
import { getDateFilterDefaults, matchesDateFilter } from '@/utils/dateFilter';

const Dashboard = () => {
  const { t } = useTranslation();
  const { transactions, accounts, investments, recurring, categories, exchangeRates, settings, saveSettings } = useFinance();
  const { theme } = useTheme();

  const dateFilter = settings.dashboard_date_filter || getDateFilterDefaults();
  const setDateFilter = (filter) => saveSettings({ dashboard_date_filter: filter });

  const { showModal, dismissModal } = useBetaWarning();

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.filter(t => t && matchesDateFilter(t.date, dateFilter));
  }, [transactions, dateFilter]);

  const filteredInvestments = useMemo(() => {
    if (!Array.isArray(investments)) return [];
    return investments.filter(inv => inv && matchesDateFilter(inv.purchase_date, dateFilter));
  }, [investments, dateFilter]);

  const totalBalanceBRL = accounts.reduce((sum, acc) => {
    const currency = acc.currency || 'BRL';
    let balanceInBRL = acc.balance;
    if (currency !== 'BRL' && exchangeRates[currency]) {
      balanceInBRL = acc.balance * exchangeRates[currency];
    }
    return sum + balanceInBRL;
  }, 0);

  const totalInvestmentsAllTime = calculateTotalInvestmentValue(investments);
  const totalAssets = totalBalanceBRL + totalInvestmentsAllTime;

  const { liabilities: totalLiabilities } = calculateAssetsLiabilities(transactions, accounts, recurring, exchangeRates);

  const filteredIncomeBRL = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => {
      const currency = t.account?.currency || 'BRL';
      const rate = t.exchange_rate || exchangeRates[currency] || 1;
      return sum + (Number(t.amount) * (currency === 'BRL' ? 1 : rate));
    }, 0);
    
  const filteredExpensesBRL = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      const currency = t.account?.currency || 'BRL';
      const rate = t.exchange_rate || exchangeRates[currency] || 1;
      return sum + (Math.abs(Number(t.amount)) * (currency === 'BRL' ? 1 : rate));
    }, 0);

  const metrics = [
    {
      id: 'balance',
      title: t('dashboard.total_balance'),
      value: formatCurrencyWithSymbol(totalBalanceBRL, 'BRL'),
      Icon: Wallet,
      textColor: 'text-gray-900 dark:text-gray-50',
      iconColor: 'text-primary',
      borderColor: 'border-gray-200 dark:border-vindex-border',
      tooltip: t('dashboard.total_balance_tooltip'),
    },
    {
      id: 'expenses',
      title: t('dashboard.expenses'),
      value: formatCurrencyWithSymbol(filteredExpensesBRL, 'BRL'),
      Icon: TrendingDown,
      textColor: 'text-gray-900 dark:text-gray-50',
      iconStyle: { color: DANGER },
      borderColor: 'border-red-200 dark:border-red-500/30',
      tooltip: t('dashboard.expenses_tooltip'),
    },
    {
      id: 'income',
      title: t('dashboard.income'),
      value: formatCurrencyWithSymbol(filteredIncomeBRL, 'BRL'),
      Icon: TrendingUp,
      textColor: 'text-gray-900 dark:text-gray-50',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20 dark:border-primary/30',
      tooltip: t('dashboard.income_tooltip'),
    },
  ];

  return (
    <div className="space-y-6 px-4 md:px-8 pb-12 w-full max-w-full overflow-hidden">
      <Helmet>
        <title>VindexValor - Dashboard</title>
      </Helmet>
      
      <BetaWarningModal open={showModal} onOpenChange={(open) => { if (!open) dismissModal(); }} />

      <OnboardingChecklist />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">{t('dashboard.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilterSelect value={dateFilter} onChange={setDateFilter} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-xl p-6 bg-white dark:bg-vindex-card border ${metric.borderColor} shadow-sm hover:shadow-md transition-shadow group`}
          >
            <div className="flex items-start justify-between z-10 relative">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 flex items-center">
                  {metric.title}
                  <InfoTooltip content={metric.tooltip} />
                </p>
                <p className={`text-2xl font-bold crypto-symbol ${metric.textColor}`}>{metric.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50`}>
                <metric.Icon size={24} className={metric.iconColor} style={metric.iconStyle} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full">
         <BudgetConsumptionChart dateFilter={dateFilter} filteredTransactions={transactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 h-[400px]">
          <TopCategoriesSection transactions={filteredTransactions} categories={categories} dateFilter={dateFilter} />
        </div>
        <div className="col-span-1 h-[400px]">
          <RecentTransactionsSection transactions={filteredTransactions} categories={categories} dateFilter={dateFilter} />
        </div>
        <div className="col-span-1 h-[400px]">
          <UpcomingRecurrencesSection recurrences={recurring} dateFilter={dateFilter} />
        </div>
      </div>

      <div className="w-full">
        <AssetLiabilityChart totalAssets={totalAssets} totalLiabilities={totalLiabilities} dateFilter={dateFilter} filteredTransactions={transactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="col-span-1 h-[400px]">
          <AssetCompositionChart accounts={accounts} investments={investments} exchangeRates={exchangeRates} totalLiabilities={totalLiabilities} />
        </div>
        <div className="col-span-1 h-[400px]">
          <AccountsSummarySection accounts={accounts} />
        </div>
      </div>

      <div className="w-full h-[400px]">
        <IncomeVsInflationChart />
      </div>
    </div>
  );
};

export default Dashboard;