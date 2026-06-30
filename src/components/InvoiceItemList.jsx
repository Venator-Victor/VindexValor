import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/utils/calculations';
import { Edit, Trash, ArrowDownRight, ArrowUpRight, ArrowUp, ArrowDown } from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const InvoiceItemList = ({ items, onEdit, onDelete }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
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

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <div className="w-4 h-4 opacity-0" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />;
  };

  const sortedCompras = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'date') {
        aValue = new Date(a.date || 0).getTime();
        bValue = new Date(b.date || 0).getTime();
      } else if (sortConfig.key === 'tipo') {
        aValue = a.amount < 0 ? 'saida' : 'entrada';
        bValue = b.amount < 0 ? 'saida' : 'entrada';
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

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-dashed">
        Nenhuma movimentação registrada nesta fatura.
      </div>
    );
  }

  const totalColor = total < 0 ? 'text-red-600 dark:text-red-400' : total > 0 ? 'text-green-600 dark:text-green-400' : 'text-primary';

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="p-3 font-medium">
                <button onClick={() => requestSort('date')} className="flex items-center gap-1.5 hover:text-foreground">
                  Data <SortIcon column="data" />
                </button>
              </th>
              <th className="p-3 font-medium">
                <button onClick={() => requestSort('description')} className="flex items-center gap-1.5 hover:text-foreground">
                  Status (Descrição) <SortIcon column="description" />
                </button>
              </th>
              <th className="p-3 font-medium">
                <button onClick={() => requestSort('tipo')} className="flex items-center gap-1.5 hover:text-foreground">
                  Tipo <SortIcon column="tipo" />
                </button>
              </th>
              <th className="p-3 font-medium">
                <button onClick={() => requestSort('categoria')} className="flex items-center gap-1.5 hover:text-foreground">
                  Categoria <SortIcon column="categoria" />
                </button>
              </th>
              <th className="p-3 font-medium">
                <button onClick={() => requestSort('amount')} className="flex items-center gap-1.5 justify-end w-full hover:text-foreground">
                  Valor <SortIcon column="amount" />
                </button>
              </th>
              <th className="p-3 font-medium text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedCompras.map(c => {
              const isSaida = c.amount < 0;
              const valColor = isSaida ? 'text-red-600 dark:text-red-400' : c.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
              
              return (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(c.date)}</td>
                  <td className="p-3 font-medium">{c.description}</td>
                  <td className="p-3">
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full w-max ${isSaida ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                      {isSaida ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {isSaida ? 'Saída' : 'Entrada'}
                    </div>
                  </td>
                  <td className="p-3">
                    {c.categories ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.categories.color }}></div>
                        <span>{c.categories.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sem categoria</span>
                    )}
                  </td>
                  <td className={`p-3 text-right font-semibold whitespace-nowrap ${valColor}`}>
                    {c.amount > 0 && '+'}{formatCurrency(c.amount)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onEdit(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/20 font-bold border-t">
            <tr>
              <td colSpan="4" className="p-3 text-right">Líquido da Fatura:</td>
              <td className={`p-3 text-right whitespace-nowrap ${totalColor}`}>{formatCurrency(total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoiceItemList;