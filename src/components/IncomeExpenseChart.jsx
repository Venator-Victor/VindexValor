import React, { useMemo } from 'react';
import { ComposedChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';

const IncomeExpenseChart = ({
  period,
  showBalance
}) => {
  const {
    transactions
  } = useFinance();

  // --- Data Processing Logic ---
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Helper to format date based on period
    const formatDateKey = (dateStr, periodType) => {
      const date = new Date(dateStr + 'T12:00:00'); // Normalize time to avoid timezone shifts
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      switch (periodType) {
        case 'Diário':
          return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}`;
        case 'Semanal':
          const startOfYear = new Date(year, 0, 1);
          const pastDaysOfYear = (date - startOfYear) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
          return `S${weekNum}`;
        case 'Quinzenal':
          return day <= 15 ? `1ª Quin. ${month + 1}` : `2ª Quin. ${month + 1}`;
        case 'Mensal':
          return date.toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit'
          });
        case 'Trimestral':
          return `T${Math.floor(month / 3) + 1} ${year}`;
        case 'Semestral':
          return `S${Math.floor(month / 6) + 1} ${year}`;
        case 'Anual':
          return `${year}`;
        default:
          return date.toLocaleDateString('pt-BR', {
            month: 'short'
          });
      }
    };

    // 1. Group transactions
    const groupedData = transactions.reduce((acc, curr) => {
      // Exclude transfers
      if (curr.type === 'transferencia') return acc;
      const key = formatDateKey(curr.date, period);
      if (!acc[key]) {
        acc[key] = {
          name: key,
          receitas: 0,
          despesas: 0,
          saldo: 0,
          sortDate: new Date(curr.date)
        };
      }
      const amount = Math.abs(Number(curr.amount));
      if (curr.type === 'entrada') {
        acc[key].receitas += amount;
      } else if (curr.type === 'saida') {
        acc[key].despesas += amount;
      }

      // Calculate balance for this point
      acc[key].saldo = acc[key].receitas - acc[key].despesas;

      // Keep earliest date for sorting purposes
      if (new Date(curr.date) < acc[key].sortDate) {
        acc[key].sortDate = new Date(curr.date);
      }
      return acc;
    }, {});

    // 2. Convert to array and sort by date
    return Object.values(groupedData).sort((a, b) => a.sortDate - b.sortDate);
  }, [transactions, period]);

  // Calculate totals for the header stats
  const {
    totalIncome,
    totalExpenses
  } = useMemo(() => {
    return chartData.reduce((acc, curr) => ({
      totalIncome: acc.totalIncome + curr.receitas,
      totalExpenses: acc.totalExpenses + curr.despesas
    }), {
      totalIncome: 0,
      totalExpenses: 0
    });
  }, [chartData]);
  
  const getPercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round(value / total * 100);
  };

  // --- Custom Tooltip ---
  const CustomTooltip = ({
    active,
    payload,
    label
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
            {label}
          </p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry, index) => {
              let labelName = '';
              let valueClass = '';
              let bulletColor = '';
              
              if (entry.dataKey === 'receitas') {
                labelName = 'Receita';
                valueClass = 'text-gray-900 dark:text-gray-100';
                bulletColor = '#10b981';
              } else if (entry.dataKey === 'despesas') {
                labelName = 'Despesa';
                valueClass = 'text-gray-900 dark:text-gray-100';
                bulletColor = '#ef4444';
              } else if (entry.dataKey === 'saldo') {
                labelName = 'Saldo';
                valueClass = 'text-gray-900 dark:text-gray-100';
                bulletColor = '#3b82f6';
              }
              if (!labelName) return null;
              if (entry.dataKey === 'saldo' && !showBalance) return null;
              
              return (
                <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bulletColor }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {labelName}
                      </span>
                    </div>
                    <span className={`text-sm font-bold font-mono ${valueClass}`} style={{ color: bulletColor }}>
                      {formatCurrency(entry.value)}
                    </span>
                 </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm mb-6 relative"
    >
      {/* Header Stats - Matches AssetLiabilityChart styling */}
      <div className="flex justify-center gap-8 md:gap-24 mb-6 pt-2">
          {/* Income Stat */}
          <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Receita</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {formatCurrency(totalIncome)}
              </div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                100%
              </div>
          </div>

          {/* Expense Stat */}
          <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Despesa</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {formatCurrency(totalExpenses)}
              </div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                {getPercentage(totalExpenses, totalIncome)}%
              </div>
          </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            {/* Removed CartesianGrid to match AssetLiabilityChart cleaner look, or kept minimal */}
             
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
              dy={10} 
              minTickGap={30} 
            />
            
            {/* Hidden Y Axis */}
            <YAxis hide={true} domain={['auto', 'auto']} />

            {/* Zero Baseline - Always visible dashed line */}
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" opacity={0.6} />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: '#6B7280', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.3 }} 
              isAnimationActive={true} 
            />
            
            {/* Income Line - Green Dashed */}
            <Line 
              type="monotone" 
              dataKey="receitas" 
              stroke="#10b981" 
              strokeWidth={3} 
              strokeDasharray="6 6" 
              dot={false} 
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 4, stroke: 'rgba(16, 185, 129, 0.2)' }} 
              animationDuration={1500} 
            />
            
            {/* Expenses Line - Red Dashed */}
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#ef4444" 
              strokeWidth={3} 
              strokeDasharray="6 6" 
              dot={false} 
              activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 4, stroke: 'rgba(239, 68, 68, 0.2)' }} 
              animationDuration={1500} 
            />

            {/* Balance Line - Blue Dashed (Conditional) */}
            {showBalance && (
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                strokeDasharray="6 6" 
                dot={false} 
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 4, stroke: 'rgba(59, 130, 246, 0.2)' }} 
                animationDuration={1500} 
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
export default IncomeExpenseChart;