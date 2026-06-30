import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/calculations';
import { Button } from '@/components/ui/button';
import { differenceInDays, isPast, parseISO } from 'date-fns';
import BxIcon, { Pencil, Trash } from '@/components/BxIcon';

const MetaProgressCard = ({ goal, onEdit, onDelete, index = 0 }) => {
  const isTargetMode = goal.goal_type === 'target_value';
  
  // Calculate percentage
  let percentage = 0;
  if (isTargetMode && goal.targetAmount > 0) {
      percentage = Math.min((goal.accumulated_amount / goal.targetAmount) * 100, 100);
  } else if (!isTargetMode && goal.contributionValue > 0) {
      if (goal.targetAmount > 0) {
          percentage = Math.min((goal.accumulated_amount / goal.targetAmount) * 100, 100);
      } else {
          percentage = 0; 
      }
  }

  const isAchieved = isTargetMode && percentage >= 100;
  const isOverdue = goal.deadline && isPast(parseISO(goal.deadline)) && !isAchieved;
  const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;

  // Colors for gauge
  const getGaugeColor = (pct) => {
    if (pct < 30) return DANGER; // Red
    if (pct < 70) return WARNING; // Yellow
    return SUCCESS; // Green
  };

  const color = getGaugeColor(percentage);
  
  // SVG Config
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white dark:bg-vindex-card rounded-xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between h-full min-h-[160px]
        ${isOverdue ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-vindex-border'}
      `}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        {/* Left Side Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm border flex-shrink-0"
            style={{ 
                backgroundColor: goal.color + '22', 
                color: goal.color,
                borderColor: goal.color + '44'
            }}
          >
            <BxIcon iconClass={`bx ${goal.icon || 'bx-target-lock'}`} size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-50 leading-tight truncate pr-1" title={goal.name}>
                {goal.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    {goal.goal_type === 'monthly_value' ? 'Recorrente' : 'Alvo Fixo'}
                </span>
            </div>
            {goal.deadline && isTargetMode && (
                <div className={`text-xs mt-1 truncate ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isOverdue ? 'Atrasada!' : `${daysLeft} dias restantes`}
                </div>
            )}
          </div>
        </div>

        {/* Right Side Gauge - Fixed Size Container */}
        <div className="relative flex items-center justify-center flex-shrink-0 w-16 h-16">
            <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-gray-100 dark:text-gray-800"
              />
              <motion.circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {percentage.toFixed(0)}%
                </span>
            </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2 text-sm">
        <div className="overflow-hidden">
           <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-semibold truncate">
             Acumulado
           </p>
           <p className="font-bold text-emerald-600 dark:text-emerald-400 truncate" title={formatCurrency(goal.accumulated_amount)}>
             {formatCurrency(goal.accumulated_amount)}
           </p>
        </div>
        <div className="text-right overflow-hidden">
           <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-semibold truncate">
              {isTargetMode ? 'Meta Total' : 'Meta Período'}
           </p>
           <p className="font-bold text-gray-900 dark:text-gray-50 truncate" title={isTargetMode ? formatCurrency(goal.targetAmount) : formatCurrency(goal.contributionValue)}>
             {isTargetMode ? formatCurrency(goal.targetAmount) : formatCurrency(goal.contributionValue)}
           </p>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-vindex-card/90 backdrop-blur-sm rounded-lg p-1 z-10 border border-gray-100 dark:border-vindex-border shadow-sm">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onEdit(goal)} 
            className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-vindex-border text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Pencil size={14} />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onDelete(goal.id)} 
            className="h-7 w-7 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            <Trash size={14} />
          </Button>
      </div>

    </motion.div>
  );
};

export default MetaProgressCard;