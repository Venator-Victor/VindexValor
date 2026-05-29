import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/utils/calculations';

const BudgetOverviewChart = ({ categories, period }) => {
  // Filter only categories with a spending limit defined
  const activeCategories = categories.filter(cat => cat.spending_limit && cat.spending_limit > 0);

  const totalSpent = activeCategories.reduce((acc, cat) => acc + (cat.currentSpending || 0), 0);
  const totalBudget = activeCategories.reduce((acc, cat) => acc + (cat.spending_limit || 0), 0);
  
  const chartData = [
    {
      name: 'Utilização',
      amount: totalSpent,
      fill: totalSpent > totalBudget ? DANGER : SUCCESS, // Red if over budget, else Green
    },
    {
      name: 'Orçamento',
      amount: totalBudget,
      fill: INFO, // Blue
    }
  ];

  if (activeCategories.length === 0) return null;

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm flex flex-col md:flex-row items-center gap-8">
      {/* Metrics */}
      <div className="flex flex-col gap-6 w-full md:w-1/3">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-vindex-text/60 mb-1">Total Utilizado</h3>
          <p className={`text-3xl font-bold ${totalSpent > totalBudget ? 'text-red-600' : 'text-gray-900 dark:text-vindex-text'}`}>
            {formatCurrency(totalSpent)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
             {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% do orçamento
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-2">
            Período: {period}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-vindex-text/60 mb-1">Orçamento Definido</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalBudget)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Considerando {activeCategories.length} categorias com limite
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[180px] w-full md:w-2/3">
         <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              barSize={32}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} 
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                 cursor={{fill: 'transparent'}}
                 content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border shadow-lg rounded-lg text-sm">
                          <span className="font-semibold text-gray-700 dark:text-vindex-text">{data.name}:</span> 
                          <span className="ml-2 font-mono text-gray-900 dark:text-vindex-text">{formatCurrency(data.amount)}</span>
                        </div>
                      );
                    }
                    return null;
                 }}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetOverviewChart;