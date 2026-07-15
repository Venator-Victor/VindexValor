import React from 'react';
import { ArrowDownUp as ArrowUpDown, ArrowUp, ArrowDown } from '@/components/BxIcon';

// Shared sort-direction indicator for every sortable table header in the app — a dim
// up/down arrow hints "this column is sortable" before the first click, then a solid
// primary-colored arrow shows the active column's direction. Accepts either 'asc'/'desc'
// (local useState-based sort) or 'ascending'/'descending' (useSortableList hook) so every
// table can share this one component regardless of which convention its own sort state uses.
const SortIcon = ({ column, sortConfig }) => {
  if (!sortConfig || sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
  const isAscending = sortConfig.direction === 'asc' || sortConfig.direction === 'ascending';
  return isAscending ? <ArrowUp className="w-3 h-3 ml-1 text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
};

export default SortIcon;
