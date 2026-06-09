import React from 'react';
import { ArrowUp, ArrowDown } from '@/components/BxIcon';
import { cn } from '@/lib/utils';

const SortableHeader = ({ label, column, sortConfig, onSort, className = "" }) => (
  <th
    className={cn('px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors', className)}
    onClick={() => onSort(column)}
  >
    <div className="flex items-center gap-1">
      {label}
      {!sortConfig || sortConfig.key !== column
        ? <div className="w-4 h-4" />
        : sortConfig.direction === 'ascending'
          ? <ArrowUp className="w-4 h-4" />
          : <ArrowDown className="w-4 h-4" />
      }
    </div>
  </th>
);

export default SortableHeader;
