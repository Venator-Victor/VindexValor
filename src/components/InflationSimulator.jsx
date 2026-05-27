import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/calculations';
import { TrendingDown, ArrowRight, AlertCircle } from 'lucide-react';

const InflationSimulator = () => {
  const [currentValue, setCurrentValue] = useState(1000);
  const [inflationRate, setInflationRate] = useState(4.50);
  const [years, setYears] = useState(5);

  const result = useMemo(() => {
    // Formula: valor_futuro = valor_atual * (1 + taxa/100)^anos
    const rate = inflationRate / 100;
    const futureValue = currentValue * Math.pow(1 + rate, years);
    return futureValue;
  }, [currentValue, inflationRate, years]);

  const purchasingPowerLoss = useMemo(() => {
    if (result === 0) return 0;
    return result - currentValue;
  }, [result, currentValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          Simulador de Inflação
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Descubra quanto seu dinheiro precisará render apenas para manter o poder de compra.
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Atual (R$)
            </label>
            <input
              type="number"
              min="0"
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Inflação Anual (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Período (Anos)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 dark:bg-vindex-bg/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Em {years} anos, você precisará de:</span>
          </div>
          
          <div className="mb-6">
            <motion.p 
              key={result}
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {formatCurrency(result)}
            </motion.p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Para comprar o mesmo que compra hoje com {formatCurrency(currentValue)}
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <span className="font-semibold">Impacto:</span> O preço das coisas aumentará cerca de <span className="font-bold">{formatCurrency(purchasingPowerLoss)}</span> neste período.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InflationSimulator;