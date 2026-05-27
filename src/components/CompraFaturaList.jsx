import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/utils/calculations';
import { Edit, Trash, ArrowDownRight, ArrowUpRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const CompraFaturaList = ({ compras, onEdit, onDelete }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'descending' });

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
    const sorted = [...compras];
    sorted.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'data') {
        aValue = new Date(a.data || 0).getTime();
        bValue = new Date(b.data || 0).getTime();
      } else if (sortConfig.key === 'tipo') {
        aValue = a.valor < 0 ? 'saida' : 'entrada';
        bValue = b.valor < 0 ? 'saida' : 'entrada';
      } else if (sortConfig.key === 'categoria') {
        aValue = a.categorias?.name || '';
        bValue = b.categorias?.name || '';
      } else if (sortConfig.key === 'valor') {
        aValue = Number(a.valor || 0);
        bValue = Number(b.valor || 0);
      } else if (sortConfig.key === 'descricao') {
        aValue = a.descricao || '';
        bValue = b.descricao || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [compras, sortConfig]);

  const total = compras.reduce((sum, item) => sum + Number(item.valor || 0), 0);

  if (!compras || compras.length === 0) {
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
                <button onClick={() => requestSort('data')} className="flex items-center gap-1.5 hover:text-foreground">
                  Data <SortIcon column="data" />
                </button>
              </th>
              <th className="p-3 font-medium">
                <button onClick={() => requestSort('descricao')} className="flex items-center gap-1.5 hover:text-foreground">
                  Status (Descrição) <SortIcon column="descricao" />
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
                <button onClick={() => requestSort('valor')} className="flex items-center gap-1.5 justify-end w-full hover:text-foreground">
                  Valor <SortIcon column="valor" />
                </button>
              </th>
              <th className="p-3 font-medium text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedCompras.map(c => {
              const isSaida = c.valor < 0;
              const valColor = isSaida ? 'text-red-600 dark:text-red-400' : c.valor > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
              
              return (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(c.data)}</td>
                  <td className="p-3 font-medium">{c.descricao}</td>
                  <td className="p-3">
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full w-max ${isSaida ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                      {isSaida ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {isSaida ? 'Saída' : 'Entrada'}
                    </div>
                  </td>
                  <td className="p-3">
                    {c.categorias ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.categorias.color }}></div>
                        <span>{c.categorias.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sem categoria</span>
                    )}
                  </td>
                  <td className={`p-3 text-right font-semibold whitespace-nowrap ${valColor}`}>
                    {c.valor > 0 && '+'}{formatCurrency(c.valor)}
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

export default CompraFaturaList;