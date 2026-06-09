import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/calculations';
import { TrendingUp } from '@/components/BxIcon';
const InvestmentSimulator = () => {
  const [monthlyAmount, setMonthlyAmount] = useState(500);
  const [period, setPeriod] = useState(10); // Default 10 years
  const [isYears, setIsYears] = useState(true);
  const [annualReturn, setAnnualReturn] = useState(10); // 10% a.a.

  const result = useMemo(() => {
    // Formula: FV = PMT * [((1 + r/12)^n - 1) / (r/12)]
    // r = annual rate / 100
    // n = total months
    
    const r = annualReturn / 100;
    const monthlyRate = r / 12;
    const n = isYears ? period * 12 : period;

    if (monthlyRate === 0) {
      return monthlyAmount * n;
    }

    const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);
    return futureValue;
  }, [monthlyAmount, period, isYears, annualReturn]);

  const totalInvested = useMemo(() => {
    const n = isYears ? period * 12 : period;
    return monthlyAmount * n;
  }, [monthlyAmount, period, isYears]);

  const totalInterest = result - totalInvested;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          Simulador de Investimentos (Juros Compostos)
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Projete seu patrimônio futuro com aportes mensais constantes.
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aporte Mensal (R$)
            </label>
            <input
              type="number"
              min="0"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Taxa de Retorno Anual (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tempo de Aplicação
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => setIsYears(false)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!isYears ? 'bg-white dark:bg-vindex-card shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Meses
                </button>
                <button
                  onClick={() => setIsYears(true)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${isYears ? 'bg-white dark:bg-vindex-card shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Anos
                </button>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max={isYears ? 100 : 1200}
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 dark:bg-vindex-bg/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-full min-h-[200px]">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Acumulado</span>
            <motion.p 
              key={result}
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 mb-6"
            >
              {formatCurrency(result)}
            </motion.p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-gray-600 dark:text-gray-400">Total Investido</span>
              <span className="font-semibold text-gray-900 dark:text-gray-200">{formatCurrency(totalInvested)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Juros Recebidos</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalInterest)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestmentSimulator;