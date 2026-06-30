import { useState, useMemo } from 'react';

export const useTransactionSort = (transactions, initialKey = 'date', initialDirection = 'descending') => {
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = localStorage.getItem('transactionSortConfig');
    return saved ? JSON.parse(saved) : { key: initialKey, direction: initialDirection };
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    localStorage.setItem('transactionSortConfig', JSON.stringify(newConfig));
  };

  const sortedTransactions = useMemo(() => {
    let sortableItems = [...(transactions || [])];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested or special values
        if (sortConfig.key === 'categoria') {
          aValue = a.categories?.name || 'Sem Categoria';
          bValue = b.categories?.name || 'Sem Categoria';
        } else if (sortConfig.key === 'conta') {
          aValue = a.account?.name || 'N/A';
          bValue = b.account?.name || 'N/A';
        } else if (sortConfig.key === 'amount') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        } else if (sortConfig.key === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  return { sortedTransactions, requestSort, sortConfig };
};