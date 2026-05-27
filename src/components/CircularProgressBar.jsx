import React from 'react';
import { formatCurrency } from '@/utils/calculations';

const CircularProgressBar = ({ current, max, size = 60, strokeWidth = 5, showBudget = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;
  const isOverLimit = max > 0 && current > max;

  const getColor = (percent) => {
    if (percent < 50) return '#10B981'; // Green
    if (percent < 80) return '#EAB308'; // Yellow
    return '#EF4444'; // Red
  };

  const color = getColor((current / max) * 100);

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
            {Math.round((current / max) * 100)}%
          </span>
        </div>
      </div>
      
      {showBudget && (
        <div className="flex flex-col justify-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Orçamento</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(max)}
          </span>
          {isOverLimit && (
            <span className="text-[10px] text-red-500 font-medium">Excedido</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CircularProgressBar;