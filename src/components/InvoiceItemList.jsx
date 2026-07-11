import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/calculations';
import { Edit as Edit2, TrashAlt as Trash2, ArrowDownRight, ArrowUpRight, ArrowUp, ArrowDown, Wallet } from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIMARY, DANGER } from '@/utils/colors';

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return <div className="w-4 h-4 opacity-0" />;
  return sortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />;
};

const InvoiceItemList = ({ items, onEdit, onDelete, onRowClick, selectedIds = [], onSelectionChange }) => {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(i => i.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selId => selId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedCompras = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'date') {
        aValue = new Date(a.date || 0).getTime();
        bValue = new Date(b.date || 0).getTime();
      } else if (sortConfig.key === 'tipo') {
        aValue = a.amount < 0 ? 'expense' : 'income';
        bValue = b.amount < 0 ? 'expense' : 'income';
      } else if (sortConfig.key === 'categoria') {
        aValue = a.categories?.name || '';
        bValue = b.categories?.name || '';
      } else if (sortConfig.key === 'amount') {
        aValue = Number(a.amount || 0);
        bValue = Number(b.amount || 0);
      } else if (sortConfig.key === 'description') {
        aValue = a.description || '';
        bValue = b.description || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, sortConfig]);

  // Sum of everything on this statement, payment line included — this is the period's
  // raw activity, which combined with the carried opening balance (shown above this
  // list) produces the invoice's actual closing balance ("what's owed").
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-dashed">
        {t('invoice_detail.item_list_empty')}
      </div>
    );
  }

  const totalColor = total < 0 ? 'text-red-600 dark:text-red-400' : total > 0 ? 'text-green-600 dark:text-green-400' : 'text-primary';

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm text-left table-fixed">
          <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
            <tr>
              <th className="px-6 py-3 w-[5%]">
                <Checkbox
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-3 w-[11%] font-medium text-gray-700 dark:text-gray-300">
                <button onClick={() => requestSort('date')} className="flex items-center gap-1.5 hover:text-foreground">
                  {t('invoice_detail.col_date')} <SortIcon column="date" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-6 py-3 w-[27%] font-medium text-gray-700 dark:text-gray-300">
                <button onClick={() => requestSort('description')} className="flex items-center gap-1.5 hover:text-foreground">
                  {t('invoice_detail.col_status_description')} <SortIcon column="description" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-6 py-3 w-[14%] font-medium text-gray-700 dark:text-gray-300">
                <button onClick={() => requestSort('tipo')} className="flex items-center gap-1.5 hover:text-foreground">
                  {t('invoice_detail.col_type')} <SortIcon column="tipo" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-6 py-3 w-[16%] font-medium text-gray-700 dark:text-gray-300">
                <button onClick={() => requestSort('categoria')} className="flex items-center gap-1.5 hover:text-foreground">
                  {t('common.category')} <SortIcon column="categoria" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-6 py-3 w-[14%] font-medium text-gray-700 dark:text-gray-300">
                <button onClick={() => requestSort('amount')} className="flex items-center gap-1.5 justify-end w-full hover:text-foreground">
                  {t('common.amount')} <SortIcon column="amount" sortConfig={sortConfig} />
                </button>
              </th>
              <th className="px-6 py-3 w-[13%] text-right font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
            {sortedCompras.map(c => {
              const isSaida = c.amount < 0;
              const valColor = isSaida ? 'text-red-600 dark:text-red-400' : c.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
              
              return (
                <tr
                  key={c.id}
                  onClick={() => onRowClick && onRowClick(c)}
                  className={`cursor-pointer transition-colors ${selectedIds.includes(c.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(c.id)}
                      onCheckedChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatDate(c.date)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-50 truncate" title={c.description}>{c.description}</td>
                  <td className="px-6 py-4">
                    {c.is_payment ? (
                      <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full w-max bg-primary/10 text-primary">
                        <Wallet className="w-3 h-3" />
                        {t('invoice_detail.item_is_payment_badge')}
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full w-max ${isSaida ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {isSaida ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {isSaida ? t('transactions.type_expense') : t('transactions.type_income')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {c.categories ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.categories.color }}></div>
                        <span className="truncate text-gray-700 dark:text-gray-300">{c.categories.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">{t('common.no_category')}</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${valColor}`}>
                    {c.amount > 0 && '+'}{formatCurrency(c.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                        className="h-8 w-8 p-0 rounded-lg border transition-colors bg-transparent"
                        style={{ borderColor: PRIMARY, color: PRIMARY }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                        className="h-8 w-8 p-0 rounded-lg border transition-colors bg-transparent"
                        style={{ borderColor: DANGER, color: DANGER }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-vindex-bg font-bold border-t border-gray-200 dark:border-vindex-border">
            <tr>
              <td colSpan="5" className="px-6 py-3 text-right text-gray-900 dark:text-gray-50">{t('invoice_detail.net_invoice_total')}</td>
              <td className={`px-6 py-3 text-right whitespace-nowrap ${totalColor}`}>{formatCurrency(total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default InvoiceItemList;