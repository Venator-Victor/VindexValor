import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrencyWithSymbol } from '@/utils/calculations';
import { Edit, Trash, ArrowDownUp as ArrowUpDown, ArrowUp, ArrowDown } from '@/components/BxIcon';
import { Checkbox } from '@/components/ui/checkbox';
import TransactionSelectionSummary from '@/components/TransactionSelectionSummary';
import { History } from '@/components/BxIcon';

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
  return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
};

const TransactionTable = ({ transactions, onEdit, onDelete, selectedIds, onSelectionChange }) => {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length && transactions.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(transactions.map(t => t.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selId => selId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = useMemo(() => {
    const sortableItems = [...transactions];
    sortableItems.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'category') {
        aVal = a.categories?.name || '';
        bVal = b.categories?.name || '';
      } else if (sortConfig.key === 'account') {
        aVal = a.account?.name || '';
        bVal = b.account?.name || '';
      } else if (sortConfig.key === 'amount') {
        aVal = Number(a.amount);
        bVal = Number(b.amount);
      } else if (sortConfig.key === 'description') {
        aVal = (a.description || a.name || '').toLowerCase();
        bVal = (b.description || b.name || '').toLowerCase();
      } else if (sortConfig.key === 'date') {
        aVal = a.date || '';
        bVal = b.date || '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [transactions, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div>
      {selectedIds && selectedIds.length > 0 && (
        <TransactionSelectionSummary 
          selectedIds={selectedIds} 
          transactions={transactions} 
        />
      )}

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[760px] text-sm text-left table-fixed">
            <thead className="bg-muted/50 text-muted-foreground border-b select-none">
              <tr>
                <th className="p-3 w-[5%]">
                  <Checkbox
                    checked={transactions.length > 0 && selectedIds.length === transactions.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3 w-[11%] font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center">{t('common.date')} <SortIcon column="date" sortConfig={sortConfig} /></div>
                </th>
                <th className="p-3 w-[29%] font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('description')}>
                  <div className="flex items-center">{t('common.description')} <SortIcon column="description" sortConfig={sortConfig} /></div>
                </th>
                <th className="p-3 w-[17%] font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('category')}>
                  <div className="flex items-center">{t('common.category')} <SortIcon column="category" sortConfig={sortConfig} /></div>
                </th>
                <th className="p-3 w-[15%] font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('account')}>
                  <div className="flex items-center">{t('common.account')} <SortIcon column="account" sortConfig={sortConfig} /></div>
                </th>
                <th className="p-3 w-[15%] font-medium cursor-pointer hover:bg-muted/80 transition-colors text-right" onClick={() => handleSort('amount')}>
                  <div className="flex items-center justify-end">{t('common.amount')} <SortIcon column="amount" sortConfig={sortConfig} /></div>
                </th>
                <th className="p-3 w-[8%] font-medium text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedTransactions.map(tx => {
                const valColor = tx.amount < 0 ? 'text-red-600 dark:text-red-400' : tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';

                return (
                  <tr key={tx.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.includes(tx.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.includes(tx.id)}
                        onCheckedChange={() => toggleSelect(tx.id)}
                      />
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(tx.date)}</td>
                    <td className="p-3 font-medium truncate" title={tx.description || tx.name}>
                      {tx.description || tx.name}
                      {tx.is_recurring && <History size={16} className="ml-2 text-primary" title={t('transactions.recurring_transaction_title')} />}
                      {tx.type === 'payment' && <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full whitespace-nowrap">{t('transactions.type_payment')}</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {tx.categories ? (
                          <>
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tx.categories.color }}></div>
                            <span className="truncate min-w-0">{tx.categories.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t('common.no_category')}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="truncate block text-muted-foreground">{tx.account?.name || 'N/A'}</span>
                    </td>
                    <td className={`p-3 text-right font-bold whitespace-nowrap ${valColor}`}>
                      {formatCurrencyWithSymbol(tx.amount, tx.account?.currency || 'BRL')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEdit(tx)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={t('common.edit')}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(tx.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title={t('common.delete')}>
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;