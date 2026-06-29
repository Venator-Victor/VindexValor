import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import {
  calculateTotalInvestmentValue,
  formatCurrencyWithSymbol,
  calculateAssetsLiabilities
} from '@/utils/calculations';

import InfoTooltip from '@/components/InfoTooltip';
import { Wallet, TrendingDown, TrendingUp } from '@/components/BxIcon';
import BudgetConsumptionChart from '@/components/BudgetConsumptionChart';
import AssetLiabilityChart from '@/components/AssetLiabilityChart';
import AssetCompositionChart from '@/components/AssetCompositionChart';
import DashboardPeriodSelector from '@/components/DashboardPeriodSelector';
import TopCategoriesSection from '@/components/TopCategoriesSection';
import RecentTransactionsSection from '@/components/RecentTransactionsSection';
import UpcomingRecurrencesSection from '@/components/UpcomingRecurrencesSection';
import InflationBudgetChart from '@/components/InflationBudgetChart';
import BetaWarningModal from '@/components/BetaWarningModal';
import useBetaWarning from '@/hooks/useBetaWarning';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { useTheme } from '@/context/ThemeContext';

const Dashboard = () => {
  const { transactions, accounts, investments, recurring, categories, exchangeRates } = useFinance();
  const { theme } = useTheme();
  
  const [selectedPeriod, setSelectedPeriod] = useState('Mensal');
  
  const { showModal, dismissModal } = useBetaWarning();

  const getStartDate = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch(period) {
      case 'Diário': return today;
      case 'Semanal': { const d = new Date(today); d.setDate(today.getDate() - 7); return d; }
      case 'Quinzenal': { const d = new Date(today); d.setDate(today.getDate() - 15); return d; }
      case 'Mensal': return new Date(today.getFullYear(), today.getMonth(), 1);
      case 'Trimestral': { const d = new Date(today); d.setMonth(today.getMonth() - 3); return d; }
      case 'Semestral': { const d = new Date(today); d.setMonth(today.getMonth() - 6); return d; }
      case 'Anual': return new Date(today.getFullYear(), 0, 1);
      default: return new Date(0);
    }
  };

  const startDate = useMemo(() => getStartDate(selectedPeriod), [selectedPeriod]);
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.filter(t => {
      if (!t || !t.date) return false;
      const tDate = new Date(t.date + 'T12:00:00');
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, startDate, endDate]);

  const filteredInvestments = useMemo(() => {
    if (!Array.isArray(investments)) return [];
    return investments.filter(inv => {
      if (!inv || !inv.purchase_date) return false;
      const invDate = new Date(inv.purchase_date + 'T12:00:00');
      return invDate >= startDate && invDate <= endDate;
    });
  }, [investments, startDate, endDate]);

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
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => {
      const currency = t.contas?.currency || 'BRL';
      const rate = t.exchange_rate || exchangeRates[currency] || 1;
      return sum + (Number(t.amount) * (currency === 'BRL' ? 1 : rate));
    }, 0);
    
  const filteredExpensesBRL = filteredTransactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => {
      const currency = t.contas?.currency || 'BRL';
      const rate = t.exchange_rate || exchangeRates[currency] || 1;
      return sum + (Math.abs(Number(t.amount)) * (currency === 'BRL' ? 1 : rate));
    }, 0);

  const metrics = [
    {
      title: 'Saldo Total (em BRL)',
      value: formatCurrencyWithSymbol(totalBalanceBRL, 'BRL'),
      Icon: Wallet,
      textColor: 'text-gray-900 dark:text-gray-50',
      iconColor: 'text-primary',
      borderColor: 'border-gray-200 dark:border-vindex-border',
      tooltip: 'Soma dos saldos atuais convertidos para BRL. Não é afetado pelo filtro de período.'
    },
    {
      title: 'Despesas (em BRL)',
      value: formatCurrencyWithSymbol(filteredExpensesBRL, 'BRL'),
      Icon: TrendingDown,
      textColor: 'text-gray-900 dark:text-gray-50',
      iconColor: 'text-vindex-danger',
      borderColor: 'border-red-200 dark:border-vindex-danger/30',
      tooltip: `Total de despesas convertidas para BRL no período selecionado (${selectedPeriod}).`
    },
    {
      title: 'Receitas (em BRL)',
      value: formatCurrencyWithSymbol(filteredIncomeBRL, 'BRL'),
      Icon: TrendingUp,
      textColor: 'text-gray-900 dark:text-gray-50',
      iconColor: 'text-primary',
      borderColor: 'border-green-200 dark:border-vindex-success/30',
      tooltip: `Total de receitas convertidas para BRL no período selecionado (${selectedPeriod}).`
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Visão geral da sua saúde financeira.</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardPeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-xl p-6 bg-white dark:bg-vindex-card border ${metric.borderColor} shadow-sm hover:shadow-md transition-all group`}
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
                <metric.Icon size={24} className={metric.iconColor} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full">
         <BudgetConsumptionChart selectedPeriod={selectedPeriod} filteredTransactions={filteredTransactions} />
      </div>

      <div className="w-full">
        <AssetLiabilityChart totalAssets={totalAssets} totalLiabilities={totalLiabilities} selectedPeriod={selectedPeriod} filteredTransactions={filteredTransactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 h-[400px]">
          <TopCategoriesSection transactions={filteredTransactions} categories={categories} selectedPeriod={selectedPeriod} />
        </div>
        <div className="col-span-1 h-[400px]">
          <RecentTransactionsSection transactions={filteredTransactions} categories={categories} selectedPeriod={selectedPeriod} />
        </div>
        <div className="col-span-1 h-[400px]">
          <UpcomingRecurrencesSection recurrences={recurring} selectedPeriod={selectedPeriod} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="h-[400px]">
          <AssetCompositionChart accounts={accounts} investments={investments} recurring={recurring} exchangeRates={exchangeRates} selectedPeriod={selectedPeriod} />
        </div>
      </div>
      
      <div className="w-full h-[400px]">
        <InflationBudgetChart />
      </div>
    </div>
  );
};

export default Dashboard;