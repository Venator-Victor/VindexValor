import React, { useState, useMemo } from 'react';
import { formatCurrencyWithSymbol } from '@/utils/calculations';
import { Edit, Trash, ArrowDownUp as ArrowUpDown, ArrowUp, ArrowDown } from '@/components/BxIcon';
import { Checkbox } from '@/components/ui/checkbox';
import TransactionSelectionSummary from '@/components/TransactionSelectionSummary';
import { History } from '@/components/BxIcon';

const TransactionTable = ({ transactions, onEdit, onDelete, selectedIds, onSelectionChange }) => {
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

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
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
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b select-none">
              <tr>
                <th className="p-3 w-10">
                  <Checkbox 
                    checked={transactions.length > 0 && selectedIds.length === transactions.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center">Data <SortIcon column="date" /></div>
                </th>
                <th className="p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('description')}>
                  <div className="flex items-center">Descrição <SortIcon column="description" /></div>
                </th>
                <th className="p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('category')}>
                  <div className="flex items-center">Categoria <SortIcon column="category" /></div>
                </th>
                <th className="p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('account')}>
                  <div className="flex items-center">Conta <SortIcon column="account" /></div>
                </th>
                <th className="p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors text-right" onClick={() => handleSort('amount')}>
                  <div className="flex items-center justify-end">Valor <SortIcon column="amount" /></div>
                </th>
                <th className="p-3 font-medium text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedTransactions.map(t => {
                const valColor = t.amount < 0 ? 'text-red-600 dark:text-red-400' : t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';

                return (
                  <tr key={t.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.includes(t.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                    <td className="p-3">
                      <Checkbox 
                        checked={selectedIds.includes(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="p-3 font-medium truncate max-w-[150px]" title={t.description || t.name}>
                      {t.description || t.name}
                      {t.is_recurring && <History size={16} className="ml-2 text-primary" title="Transação Recorrente" />}
                      {t.type === 'payment' && <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full whitespace-nowrap">Pagamento</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {t.categories ? (
                          <>
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.categories.color }}></div>
                            <span className="truncate max-w-[100px]">{t.categories.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem categoria</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="truncate max-w-[100px] block text-muted-foreground">{t.account?.name || 'N/A'}</span>
                    </td>
                    <td className={`p-3 text-right font-bold whitespace-nowrap ${valColor}`}>
                      {formatCurrencyWithSymbol(t.amount, t.account?.currency || 'BRL')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEdit(t)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
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