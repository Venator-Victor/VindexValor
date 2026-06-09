import React from 'react';
import { formatCurrency } from '@/utils/calculations';
import { TrendingUp, TrendingDown } from '@/components/BxIcon';
const IncomeExpenseHeader = ({ totalIncome, totalExpenses }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Income Card */}
      <div className="bg-white dark:bg-vindex-card p-6 rounded-xl shadow-sm border border-green-100 dark:border-green-900/30 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Receitas</span>
        </div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(totalIncome)}
        </div>
      </div>

      {/* Expense Card */}
      <div className="bg-white dark:bg-vindex-card p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Despesas</span>
        </div>
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
          {formatCurrency(totalExpenses)}
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseHeader;