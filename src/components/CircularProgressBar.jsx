import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/calculations';

const CircularProgressBar = ({ current, max, size = 60, strokeWidth = 5, showBudget = true, mode = 'usage', color: colorOverride }) => {
  const { t } = useTranslation();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;
  // "Over the limit" only makes sense for usage (spending past a budget) — a goal
  // exceeding its target is a good thing, not a warning state.
  const isOverLimit = mode === 'usage' && max > 0 && current > max;

  const getColor = (percent) => {
    if (mode === 'progress') {
      if (percent < 30) return DANGER; // Red
      if (percent < 80) return WARNING; // Yellow
      return SUCCESS; // Green
    }
    if (percent <= 50) return SUCCESS; // Green
    if (percent < 90) return WARNING; // Yellow
    return DANGER; // Red
  };

  const color = colorOverride || getColor(percentage);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-100 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[10px] font-bold ${isOverLimit ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      
      {showBudget && (
        <div className="flex flex-col justify-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('common.budget')}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(max)}
          </span>
          {isOverLimit && (
            <span className="text-[10px] text-red-500 font-medium">{t('common.exceeded')}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CircularProgressBar;