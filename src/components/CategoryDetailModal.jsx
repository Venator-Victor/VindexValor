import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculations';
import CircularProgressBar from '@/components/CircularProgressBar';
import { ArrowDownRight, ArrowUpRight, Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import BxIcon from '@/components/BxIcon';
import { PRIMARY } from '@/utils/colors';

const CategoryDetailModal = ({ isOpen, onClose, category, transactions, onEdit, onDelete }) => {
  const categoryTransactions = useMemo(() => {
    if (!category || !transactions) return [];
    return transactions
      .filter(t => t.category_id === category.id || (t.categorias && t.categorias.name === category.name))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [category, transactions]);

  const { totalIncome, totalExpense } = useMemo(() => {
    return categoryTransactions.reduce((acc, t) => {
      if (t.type === 'entrada') acc.totalIncome += Math.abs(t.amount);
      if (t.type === 'saida') acc.totalExpense += Math.abs(t.amount);
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });
  }, [categoryTransactions]);

  if (!category) return null;

  const hasLimit = category.spending_limit > 0;
  const currentSpending = totalExpense; // Usually categories track expenses against a budget
  const percentage = hasLimit ? Math.min((currentSpending / category.spending_limit) * 100, 100).toFixed(0) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b border-border pb-4 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: category.color + '22', borderColor: category.color + '44' }}
              >
                <BxIcon iconClass={category.icon} size={24} style={{ color: category.color }} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{category.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{categoryTransactions.length} transações</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { onClose(); onEdit(category); }}
                className="gap-1"
                style={{ borderColor: PRIMARY, color: PRIMARY }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar
              </Button>
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(category.id)}
                  className="gap-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
              <p className="text-xs text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Receitas
              </p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
              <p className="text-xs text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> Despesas
              </p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(totalExpense)}</p>
            </div>
          </div>

          {hasLimit && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Orçamento {category.budget_period}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {formatCurrency(currentSpending)} de {formatCurrency(category.spending_limit)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CircularProgressBar 
                  current={currentSpending} 
                  max={category.spending_limit} 
                  size={50} 
                  showBudget={false} 
                  strokeWidth={5} 
                />
                <span className={`text-sm font-bold ${percentage > 100 ? 'text-destructive' : ''}`}>
                  {percentage}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <h4 className="text-sm font-bold text-foreground mb-3 sticky top-0 bg-card py-2">
            Histórico de Transações
          </h4>
          
          <div className="space-y-2">
            {categoryTransactions.length > 0 ? (
              categoryTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/50 rounded-lg border border-border/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate pr-2">
                      {t.description || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                  </div>
                  <div
                    className="font-bold text-sm whitespace-nowrap pl-2"
                    style={{ color: t.type === 'entrada' ? '#10b981' : t.type === 'saida' ? '#ef4444' : PRIMARY }}
                  >
                    {t.type === 'entrada' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma transação nesta categoria.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDetailModal;