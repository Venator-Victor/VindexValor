import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, getPeriodStartDate } from '@/utils/calculations';
import CircularProgressBar from '@/components/CircularProgressBar';
import BudgetPeriodBreakdown from '@/components/BudgetPeriodBreakdown';
import BxIcon, { ArrowDownRight, ArrowUpRight, Edit as Edit2, TrashAlt as Trash2, ChevronRight } from '@/components/BxIcon';
import { PRIMARY, DANGER } from '@/utils/colors';

const CategoryDetailModal = ({ isOpen, onClose, category, categories, transactions, onEdit, onDelete, onSelectCategory }) => {
  const { t, i18n } = useTranslation();

  const childCategories = useMemo(() => {
    if (!category || !categories) return [];
    return categories
      .filter(c => c.parent_id === category.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [category, categories]);

  const childIds = useMemo(() => childCategories.map(c => c.id), [childCategories]);

  const spendingLimit = Number(category?.spending_limit) || 0;
  const hasLimit = !!category?.budget_enabled && spendingLimit > 0;
  // Only categories with a budget have a meaningful "period" to scope activity
  // to — without one, the transaction list/history below is the all-time view.
  const periodStart = useMemo(() => {
    if (!hasLimit) return null;
    return getPeriodStartDate(category.budget_period || 'monthly');
  }, [hasLimit, category?.budget_period]);

  const isWithinPeriod = (dateStr, start) => {
    if (!start) return true;
    const tDate = new Date(dateStr + 'T12:00:00');
    return tDate >= start && tDate <= new Date();
  };

  const categoryTransactions = useMemo(() => {
    if (!category || !transactions) return [];
    return transactions
      .filter(t => t.category_id === category.id || (t.categories && t.categories.name === category.name))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [category, transactions]);

  // Header stats roll up subcategory activity into the parent and, when the
  // category has a budget, scope everything to its own budget period —
  // otherwise a budget tracked "this month" would count every transaction
  // ever recorded for the category, wildly inflating the percentage.
  // The transaction list below (`categoryTransactions`) stays all-time, since
  // it's a full history view, not a budget-tracking figure.
  const rolledUpTransactions = useMemo(() => {
    if (!category || !transactions) return [];
    const ids = childIds.length > 0 ? [category.id, ...childIds] : [category.id];
    return transactions.filter(t => ids.includes(t.category_id) && isWithinPeriod(t.date, periodStart));
  }, [category, transactions, childIds, periodStart]);

  const { totalIncome, totalExpense } = useMemo(() => {
    return rolledUpTransactions.reduce((acc, t) => {
      const amount = Math.abs(Number(t.amount) || 0);
      if (t.type === 'income') acc.totalIncome += amount;
      if (t.type === 'expense') acc.totalExpense += amount;
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });
  }, [rolledUpTransactions]);

  // Each subcategory is scoped to its OWN budget period (a child can run on a
  // different cadence than its parent), independent of the parent's rollup above.
  const getChildStats = (child) => {
    const childLimit = Number(child.spending_limit) || 0;
    const childHasLimit = child.budget_enabled && childLimit > 0;
    const childPeriodStart = childHasLimit ? getPeriodStartDate(child.budget_period || 'monthly') : null;
    const childExpense = transactions
      .filter(t => t.category_id === child.id && t.type === 'expense' && isWithinPeriod(t.date, childPeriodStart))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    return { childExpense, childLimit, childHasLimit };
  };

  if (!category) return null;

  const currentSpending = totalExpense; // Usually categories track expenses against a budget
  const percentage = hasLimit ? ((currentSpending / spendingLimit) * 100).toFixed(0) : 0;

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
                <p className="text-sm text-muted-foreground">{t('categories.transaction_count', { count: rolledUpTransactions.length })}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
              <p className="text-xs text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> {t('common.income_label')}
              </p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
              <p className="text-xs text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> {t('common.expenses_label')}
              </p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(totalExpense)}</p>
            </div>
          </div>

          {hasLimit && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t('categories.budget_of_period', { period: t(`period.${category.budget_period}`) })}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {t('categories.spent_of_total', { spent: formatCurrency(currentSpending), total: formatCurrency(spendingLimit) })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CircularProgressBar
                    current={currentSpending}
                    max={spendingLimit}
                    size={50}
                    showBudget={false}
                    strokeWidth={5}
                  />
                  <span className={`text-sm font-bold ${percentage > 100 ? 'text-destructive' : ''}`}>
                    {percentage}%
                  </span>
                </div>
              </div>
              <BudgetPeriodBreakdown amount={spendingLimit} period={category.budget_period} />
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onClose(); onEdit(category); }}
              className="flex-1 gap-1"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              {t('common.edit')}
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(category.id)}
                className="flex-1 gap-1"
                style={{ borderColor: DANGER, color: DANGER }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('common.delete')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {childCategories.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-bold text-foreground mb-3">
                {t('categories.subcategories_title')}
              </h4>
              <div className="space-y-2">
                {childCategories.map((child) => {
                  const { childExpense, childLimit, childHasLimit } = getChildStats(child);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelectCategory && onSelectCategory(child)}
                      className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/50 rounded-lg border border-border/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                          style={{ backgroundColor: child.color + '22', borderColor: child.color + '44' }}
                        >
                          <BxIcon iconClass={child.icon} size={16} style={{ color: child.color }} />
                        </div>
                        <span className="font-medium text-sm text-foreground truncate">{child.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(childExpense)}{childHasLimit && ` / ${formatCurrency(childLimit)}`}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <h4 className="text-sm font-bold text-foreground mb-3 sticky top-0 bg-card py-2">
            {t('categories.transaction_history')}
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
                      {new Date(t.date).toLocaleDateString(i18n.language, { timeZone: 'UTC' })}
                    </p>
                  </div>
                  <div
                    className="font-bold text-sm whitespace-nowrap pl-2"
                    style={{ color: t.type === 'income' ? '#10b981' : t.type === 'expense' ? '#ef4444' : PRIMARY }}
                  >
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">{t('categories.no_transactions')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDetailModal;
