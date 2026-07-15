import React from 'react';
import SortIcon from '@/components/SortIcon';
import { cn } from '@/lib/utils';

const SortableHeader = ({ label, column, sortConfig, onSort, className = "", align = "left" }) => (
  <th
    className={cn('px-6 py-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors', align === 'right' ? 'text-right' : 'text-left', className)}
    onClick={() => onSort(column)}
  >
    <div className={cn('flex items-center', align === 'right' && 'justify-end')}>
      {label}
      <SortIcon column={column} sortConfig={sortConfig} />
    </div>
  </th>
);

export default SortableHeader;
