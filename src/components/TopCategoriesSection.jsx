import React, { useMemo } from 'react';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TopCategoriesSection = ({ transactions, categories, selectedPeriod }) => {
  const navigate = useNavigate();

  const categoryStats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'saida');
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    const stats = {};
    
    expenses.forEach(t => {
      const catName = t.categorias?.name || 'Outros';
      if (!stats[catName]) {
        stats[catName] = {
          id: t.categoria_id,
          amount: 0,
          color: t.categorias?.color || '#94a3b8',
          icon: t.categorias?.icon || 'bx-purchase-tag'
        };
      }
      stats[catName].amount += Math.abs(Number(t.amount));
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
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <i className='bx bx-pie-chart-alt-2 text-blue-500'></i>
            Categorias
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400">
            {selectedPeriod}
        </span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden max-h-[400px] pr-2 custom-scrollbar">
        {categoryStats.length > 0 ? (
          categoryStats.map((cat, index) => (
            <motion.div 
              key={cat.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate('/transacoes', { state: { filterCategoryId: cat.id || 'null' } })}
              className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-sm shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <i className={`bx ${cat.icon}`}></i>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm truncate max-w-[120px]" title={cat.name}>
                    {cat.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-bold text-gray-900 dark:text-gray-50 text-sm">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color 
                  }}
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <i className='bx bx-bar-chart-alt-2 text-4xl mb-2'></i>
            <p className="text-sm">Sem dados neste período</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopCategoriesSection;