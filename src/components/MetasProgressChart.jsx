import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/calculations';
import { Card } from "@/components/ui/card";

const MetasProgressChart = ({ goals, selectedPeriod, filterType }) => {

  // Helper to normalize contribution to a monthly base
  const getMonthlyBaseContribution = (value, frequency) => {
    const val = Number(value) || 0;
    switch (frequency) {
      case 'Diário': return val * 30;
      case 'Semanal': return val * 4.33;
      case 'Quinzenal': return val * 2;
      case 'Mensal': return val;
      case 'Trimestral': return val / 3;
      case 'Semestral': return val / 6;
      case 'Anual': return val / 12;
      default: return val;
    }
  };

  // Helper to scale monthly base to selected view period
  const scaleToPeriod = (monthlyBase, period) => {
    switch (period) {
      case 'semana': return monthlyBase / 4.33;
      case 'mensal': return monthlyBase;
      case 'trimestre': return monthlyBase * 3;
      case 'semestre': return monthlyBase * 6;
      case 'ano': return monthlyBase * 12;
      default: return monthlyBase;
    }
  };

  const metrics = useMemo(() => {
    let totalPlanned = 0;
    let totalRealized = 0;

    // Filter Logic matches Metas.jsx
    const filteredGoals = goals.filter(g => {
        if (filterType === 'valor_final') return g.tipo_meta === 'valor_final';
        if (filterType === 'valor_mensal') return g.tipo_meta === 'valor_mensal';
        return true;
    });

    filteredGoals.forEach(goal => {
      // Planned
      if (goal.tipo_meta === 'valor_mensal') {
         // Use periodic calculation
         const monthlyBase = getMonthlyBaseContribution(goal.contributionValue, goal.periodFrequency);
         totalPlanned += scaleToPeriod(monthlyBase, selectedPeriod);
      } else {
         // For Fixed goals, planned is the full target amount 
         // (since they don't have a "period" contribution usually, or user wants to see total target)
         totalPlanned += Number(goal.targetAmount) || 0;
      }

      // Realized (Accumulated)
      totalRealized += Number(goal.valor_acumulado) || 0;
    });

    // Cap percentage at 100 for visual consistency if needed, but display real %
    const percentage = totalPlanned > 0 ? (totalRealized / totalPlanned) * 100 : 0;

    return {
      planned: totalPlanned,
      realized: totalRealized,
      percentage
    };
  }, [goals, selectedPeriod, filterType]);

  // Gauge Color Logic
  const getGaugeColor = (pct) => {
    if (pct < 30) return DANGER; // Red
    if (pct < 70) return WARNING; // Yellow
    return SUCCESS; // Green
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(metrics.percentage, 100) / 100) * circumference;
  const color = getGaugeColor(metrics.percentage);

  const labelText = filterType === 'valor_mensal' 
      ? `Objetivo (${selectedPeriod})` 
      : 'Objetivo Total';

  return (
    <Card className="p-6 mb-8 bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border shadow-sm">
      <div className="flex flex-col relative">
        
        {/* 3-Column Layout */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-2">
          
          {/* Left: Realized */}
          <div className="flex-1 text-center md:text-right order-2 md:order-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Realizado
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.realized)}
            </div>
          </div>

          {/* Center: Circular Gauge */}
          <div className="relative flex items-center justify-center order-1 md:order-2">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-100 dark:text-gray-800"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.percentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Right: Planned */}
          <div className="flex-1 text-center md:text-left order-3">
             <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
              {labelText}
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(metrics.planned)}
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
};

export default MetasProgressChart;