import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER } from '@/utils/colors';
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import BxIcon, {
  Plus, Folder, TrashAlt as Trash2, Edit as Edit2,
  ChevronDown, ChevronRight, Search, X,
} from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import SortableHeader from '@/components/SortableHeader';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/components/ui/use-toast';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';
import SelectInput from '@/components/ui/SelectInput';
import NumberInput from '@/components/ui/NumberInput';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, calculateCategoryActivity } from '@/utils/calculations';
import { getParentCategoryOptions, groupChildrenByParent } from '@/utils/categoryTree';
import { normalizeText } from '@/utils/text';
import DefaultCategoriesModal from '@/components/DefaultCategoriesModal';
import GaugeSummaryCard from '@/components/GaugeSummaryCard';
import { useSortableList } from '@/hooks/useSortableList';
import { PERIOD_OPTIONS } from '@/utils/periodOptions';
import CategoryDetailModal from '@/components/CategoryDetailModal';
import BudgetPeriodBreakdown from '@/components/BudgetPeriodBreakdown';
import ViewToggle from '@/components/ui/ViewToggle';

const emptyFormData = {
  name: '',
  color: '#283768',
  icon: 'bx bx-tag',
  spending_limit: '',
  budget_period: 'monthly',
  budget_enabled: true,
  parent_id: null,
};

const Categories = () => {
  const { t } = useTranslation();
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useFinance();

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDetailCategory, setSelectedDetailCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const [displayLayout, setDisplayLayout] = useState(() => {
    return localStorage.getItem('categories_view_preference') || 'card';
  });

  const [formData, setFormData] = useState(emptyFormData);

  const handleLayoutChange = layout => {
    setDisplayLayout(layout);
    localStorage.setItem('categories_view_preference', layout);
  };

  // Fallback period for categories without a budget (they have no "own"
  // cadence to score activity against). No user-facing control for this —
  // a page-wide period selector isn't meaningful once budgeted categories
  // are always scored against their own budget_period (see below).
  const currentPeriod = 'monthly';

  // Own (non-rolled-up) activity + transaction count per category, since every
  // transaction belongs to exactly one category id — this is what the page's
  // grand-total gauges and the flat grid view use, so nothing is double counted.
  //
  // A budgeted category is always scored against its OWN budget_period (a
  // weekly-budgeted category's spending is always "this week"), never the
  // page's currentPeriod selector — comparing e.g. a month of activity
  // against a weekly limit silently inflates the percentage. Categories
  // without a budget have no "own" cadence, so they fall back to the page's
  // selector, which is the only period concept that applies to them.
  const baseCategories = useMemo(() => categories.map(cat => {
    const hasBudget = cat.budget_enabled && cat.spending_limit > 0;
    const activityPeriod = hasBudget ? (cat.budget_period || 'monthly') : currentPeriod;
    const { spending, total } = calculateCategoryActivity(cat.id, activityPeriod, transactions);
    const transactionCount = transactions.filter(t =>
      t.category_id === cat.id || t.categories?.name === cat.name || t.category === cat.name
    ).length;
    return {
      ...cat,
      currentSpending: spending,
      totalActivity: total,
      transactionCount,
      hasBudget,
    };
  }), [categories, currentPeriod, transactions]);

  const childrenByParentId = useMemo(() => groupChildrenByParent(baseCategories), [baseCategories]);

  // Adds rolled-up (own + subcategories) numbers for any category that has
  // children — used only for that parent's own row/card display, never fed
  // back into the grand totals below. The rollup uses the same period as the
  // parent's own spending above (its budget period if it has one, else the
  // page selector), so it stays consistent with the parent's own figure.
  const categoriesWithDynamicSpending = useMemo(() => baseCategories.map(cat => {
    const children = childrenByParentId.get(cat.id) || [];
    if (children.length === 0) {
      return {
        ...cat,
        displaySpending: cat.currentSpending,
        displayTotal: cat.totalActivity,
        displayTransactionCount: cat.transactionCount,
        childrenBudgetTotal: 0,
      };
    }
    const childIds = children.map(c => c.id);
    const rollupPeriod = cat.hasBudget ? (cat.budget_period || 'monthly') : currentPeriod;
    const rolledUp = calculateCategoryActivity([cat.id, ...childIds], rollupPeriod, transactions);
    const childrenBudgetTotal = children.reduce(
      (sum, c) => sum + (c.budget_enabled && c.spending_limit ? Number(c.spending_limit) : 0), 0
    );
    return {
      ...cat,
      displaySpending: rolledUp.spending,
      displayTotal: rolledUp.total,
      displayTransactionCount: cat.transactionCount + children.reduce((sum, c) => sum + c.transactionCount, 0),
      childrenBudgetTotal,
    };
  }), [baseCategories, childrenByParentId, currentPeriod, transactions]);

  // Sorting Hook — applied to the full flat list; both views derive their
  // rendered set from this so a sort choice made in the table view carries
  // over to the grid view too.
  const {
    items: sortedCategories,
    requestSort,
    sortConfig
  } = useSortableList(categoriesWithDynamicSpending);

  // Calculate totals for Chart — flat over every category's own numbers.
  const activeCategories = sortedCategories.filter(cat => cat.hasBudget);
  const totalSpent = activeCategories.reduce((acc, cat) => acc + (cat.currentSpending || 0), 0);
  const totalBudget = activeCategories.reduce((acc, cat) => acc + (cat.spending_limit || 0), 0);

  const normalizedSearch = normalizeText(searchTerm.trim());
  const matchesSearchTerm = useCallback(
    (cat) => !normalizedSearch || normalizeText(cat.name).includes(normalizedSearch),
    [normalizedSearch]
  );

  // Grid view: flat, unchanged structure — just filtered by search.
  const gridCategories = useMemo(
    () => (normalizedSearch ? sortedCategories.filter(matchesSearchTerm) : sortedCategories),
    [sortedCategories, normalizedSearch, matchesSearchTerm]
  );

  // Table view: top-level rows only; a parent is kept if it or any child
  // matches the search, so a matching subcategory never loses its context.
  const tableTopLevel = useMemo(() => {
    const topLevel = sortedCategories.filter(c => !c.parent_id);
    if (!normalizedSearch) return topLevel;
    return topLevel.filter(cat => {
      if (matchesSearchTerm(cat)) return true;
      const children = childrenByParentId.get(cat.id) || [];
      return children.some(matchesSearchTerm);
    });
  }, [sortedCategories, childrenByParentId, normalizedSearch, matchesSearchTerm]);

  const getVisibleChildren = (parent) => {
    const children = childrenByParentId.get(parent.id) || [];
    if (!normalizedSearch || matchesSearchTerm(parent)) return children;
    return children.filter(matchesSearchTerm);
  };

  const toggleExpanded = (id, e) => {
    if (e) e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const parentCategoryOptions = useMemo(
    () => getParentCategoryOptions(categories, editingCategory?.id ?? null),
    [categories, editingCategory]
  );
  const isParentSelectionLocked = !!editingCategory && (childrenByParentId.get(editingCategory.id)?.length > 0);

  const handleSubmit = e => {
    e.preventDefault();
    const categoryData = {
      ...formData,
      spending_limit: formData.budget_enabled && formData.spending_limit ? Number(formData.spending_limit) : null,
      budget_period: formData.budget_period,
      budget_enabled: formData.budget_enabled,
      parent_id: isParentSelectionLocked ? null : (formData.parent_id || null),
    };
    if (editingCategory && updateCategory) {
      updateCategory(editingCategory.id, categoryData);
      toast({ title: t('categories.updated_success') });
    } else if (addCategory) {
      addCategory(categoryData);
      toast({ title: t('categories.created_success') });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData(emptyFormData);
    setEditingCategory(null);
  };

  const handleEdit = (category, e) => {
    if (e) e.stopPropagation();
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
      spending_limit: category.spending_limit || '',
      budget_period: category.budget_period || 'monthly',
      budget_enabled: category.budget_enabled !== false,
      parent_id: category.parent_id || null,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    const category = categories.find(c => c.id === id);
    if (!category) return;

    const childCount = (childrenByParentId.get(id) || []).length;
    if (childCount > 0) {
      toast({
        title: t('categories.cannot_delete_has_subcategories_title'),
        description: t('categories.cannot_delete_has_subcategories_desc', { count: childCount }),
        variant: "destructive"
      });
      setDeleteId(null);
      return;
    }

    const transactionCount = transactions.filter(t => t.category_id === category.id || t.categories?.name === category.name || t.category === category.name).length;
    if (transactionCount > 0) {
      toast({
        title: t('categories.cannot_delete_title'),
        description: t('categories.cannot_delete_desc', { count: transactionCount }),
        variant: "destructive"
      });
      setDeleteId(null);
      return;
    }
    if (deleteCategory) {
      deleteCategory(id);
      toast({ title: t('categories.deleted_success') });
    }
    setDeleteId(null);
    setSelectedDetailCategory(null);
  };

  const handleCardClick = (category) => {
    setSelectedDetailCategory(category);
  };



  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - Categories</title>
        <meta name="description" content={t('categories.subtitle')} />
      </Helmet>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('categories.title')}</h1>
          <p className="text-gray-700 dark:text-gray-300">{t('categories.subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-vindex-text/40" />
            <input
              type="text"
              placeholder={t('categories.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[42px] pl-9 pr-8 rounded-lg border border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-card text-sm text-gray-900 dark:text-gray-100 outline-none hover:border-primary focus:border-primary"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ViewToggle value={displayLayout} onChange={handleLayoutChange} className="h-[42px]" />

            <Button onClick={() => setIsDefaultModalOpen(true)} className="border-none text-gray-900 rounded-lg flex-1 sm:flex-none whitespace-nowrap transition-colors h-[42px]" style={{ backgroundColor: PRIMARY }} onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY_HOVER} onMouseLeave={e => e.currentTarget.style.backgroundColor = PRIMARY}>
              <Plus className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">{t('categories.new')}</span>
              <span className="sm:hidden">{t('common.new')}</span>
            </Button>
          </div>
        </div>
      </div>

      <GaugeSummaryCard
        leftLabel={t('categories.total_usage')}
        leftValue={formatCurrency(totalSpent)}
        gaugeValue={totalSpent}
        gaugeMax={totalBudget}
        rightLabel={t('categories.total_budget')}
        rightValue={formatCurrency(totalBudget)}
        rightClassName="text-2xl font-bold text-primary"
      />

      {/* Categories List/Grid */}
      {sortedCategories.length === 0 ? (
        <EmptyState icon={Folder} message={t('categories.empty')} buttonLabel={t('categories.create_first')} onButtonClick={() => setIsDefaultModalOpen(true)} />
      ) : (displayLayout === 'card' ? gridCategories.length === 0 : tableTopLevel.length === 0) ? (
        <EmptyState icon={Search} message={t('categories.no_results')} />
      ) : (
        <>
           {/* Grid View */}
           {displayLayout === 'card' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <AnimatePresence>
                 {gridCategories.map((category, index) => {
                    const parentName = category.parent_id
                      ? categories.find(c => c.id === category.parent_id)?.name
                      : null;

                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleCardClick(category)}
                        className="bg-white dark:bg-vindex-card rounded-xl p-4 border border-gray-200 dark:border-vindex-border transition-shadow shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
                        onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
                        onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                      >
                        <div className="flex items-center gap-3 w-full border-b border-gray-100 dark:border-vindex-border pb-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border shrink-0" style={{ backgroundColor: category.color + '22', borderColor: category.color + '44' }}>
                              <BxIcon iconClass={category.icon} size={20} style={{ color: category.color }} />
                            </div>

                            <div className="text-left flex-grow overflow-hidden">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 leading-tight break-words" title={category.name}>{category.name}</h3>
                              {parentName ? (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={t('categories.subcategory_of', { parent: parentName })}>
                                  {t('categories.subcategory_of', { parent: parentName })}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-700 dark:text-gray-300">{t('categories.transaction_count', { count: category.transactionCount })}</p>
                              )}
                            </div>
                        </div>

                        <div className="w-full p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-100 dark:border-vindex-border flex items-center justify-between mt-3">
                          <div className="text-left">
                            <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{category.hasBudget ? t('categories.current_spending') : t('categories.total_moved')}</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-50 block">{formatCurrency(category.hasBudget ? category.currentSpending : category.totalActivity)}</span>
                          </div>
                          {category.hasBudget && (
                            <div className="text-right">
                              <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('categories.col_budget')}</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-gray-50 block">{formatCurrency(category.spending_limit)}</span>
                            </div>
                          )}
                        </div>
                     </motion.div>
                    );
                 })}
               </AnimatePresence>
             </div>
           )}

           {/* List View */}
           {displayLayout === 'list' && (
             <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                         <tr>
                            <SortableHeader label={t('categories.col_category')} column="name" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('categories.col_transactions')}</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('categories.col_usage')}</th>
                            <SortableHeader label={t('categories.col_budget')} column="spending_limit" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader label={t('categories.col_period')} column="budget_period" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-6 py-3 text-right font-medium text-gray-700 dark:text-gray-300">{t('common.actions')}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                         {tableTopLevel.map(category => {
                            const visibleChildren = getVisibleChildren(category);
                            const hasChildren = visibleChildren.length > 0;
                            const isExpanded = !!normalizedSearch || !collapsedIds.has(category.id);
                            const hasLimit = category.hasBudget;

                            const rows = [
                              <tr key={category.id} onClick={() => handleCardClick(category)} className="cursor-pointer transition-colors" onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                                  <td className="px-6 py-4">
                                     <div className="flex items-center gap-2">
                                        <button
                                           type="button"
                                           onClick={(e) => hasChildren && toggleExpanded(category.id, e)}
                                           aria-label={isExpanded ? t('categories.collapse_subcategories') : t('categories.expand_subcategories')}
                                           className={`w-5 h-5 flex items-center justify-center shrink-0 rounded transition-colors ${hasChildren ? 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer' : 'invisible'}`}
                                        >
                                           {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: category.color + '22', color: category.color }}>
                                           <BxIcon iconClass={category.icon} size={18} style={{ color: category.color }} />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-gray-50">{category.name}</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                     {category.displayTransactionCount}
                                  </td>
                                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-50">
                                     {formatCurrency(hasLimit ? category.displaySpending : category.displayTotal)}
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                     {hasLimit ? <span>{formatCurrency(category.spending_limit)}</span> : '-'}
                                     {category.childrenBudgetTotal > 0 && (
                                        <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                                           {t('categories.subcategories_budget_info', { amount: formatCurrency(category.childrenBudgetTotal) })}
                                        </span>
                                     )}
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                     {hasLimit ? <span className="text-xs">{t(`period.${category.budget_period}`)}</span> : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <div className="flex justify-end gap-2">
                                        <Button
                                           size="sm"
                                           variant="outline"
                                           onClick={(e) => handleEdit(category, e)}
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
                                           onClick={(e) => { e.stopPropagation(); setDeleteId(category.id); }}
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
                            ];

                            if (hasChildren && isExpanded) {
                               visibleChildren.forEach(child => {
                                  const childHasLimit = child.hasBudget;
                                  rows.push(
                                     <tr key={child.id} onClick={() => handleCardClick(child)} className="cursor-pointer transition-colors bg-gray-50/50 dark:bg-vindex-bg/30" onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                                        <td className="px-6 py-3">
                                           <div className="flex items-center gap-2 pl-7">
                                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: child.color + '22', color: child.color }}>
                                                 <BxIcon iconClass={child.icon} size={16} style={{ color: child.color }} />
                                              </div>
                                              <span className="text-gray-700 dark:text-gray-300">{child.name}</span>
                                           </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                                           {child.transactionCount}
                                        </td>
                                        <td className="px-6 py-3 text-gray-900 dark:text-gray-50">
                                           {formatCurrency(childHasLimit ? child.currentSpending : child.totalActivity)}
                                        </td>
                                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                                           {childHasLimit ? <span>{formatCurrency(child.spending_limit)}</span> : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                                           {childHasLimit ? <span className="text-xs">{t(`period.${child.budget_period}`)}</span> : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                           <div className="flex justify-end gap-2">
                                              <Button
                                                 size="sm"
                                                 variant="outline"
                                                 onClick={(e) => handleEdit(child, e)}
                                                 className="h-7 w-7 p-0 rounded-lg border transition-colors bg-transparent"
                                                 style={{ borderColor: PRIMARY, color: PRIMARY }}
                                                 onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                                                 onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
                                              >
                                                 <Edit2 className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                 size="sm"
                                                 variant="outline"
                                                 onClick={(e) => { e.stopPropagation(); setDeleteId(child.id); }}
                                                 className="h-7 w-7 p-0 rounded-lg border transition-colors bg-transparent"
                                                 style={{ borderColor: DANGER, color: DANGER }}
                                                 onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
                                                 onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
                                              >
                                                 <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                           </div>
                                        </td>
                                     </tr>
                                  );
                               });
                            }

                            return rows;
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
         </>
      )}

      {/* Category Details Modal */}
      <CategoryDetailModal
        isOpen={!!selectedDetailCategory}
        onClose={() => setSelectedDetailCategory(null)}
        category={selectedDetailCategory}
        categories={categories}
        transactions={transactions}
        onEdit={(cat) => handleEdit(cat, null)}
        onDelete={(id) => { setSelectedDetailCategory(null); setDeleteId(id); }}
        onSelectCategory={(cat) => setSelectedDetailCategory(cat)}
      />

      {/* Default Categories Modal */}
      <DefaultCategoriesModal
        isOpen={isDefaultModalOpen}
        onClose={() => setIsDefaultModalOpen(false)}
        onCreateCustom={() => {
          setIsDefaultModalOpen(false);
          resetForm();
          setIsDialogOpen(true);
        }}
      />

      {/* Main Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={open => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
               {editingCategory ? t('categories.edit') : t('categories.new')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('common.name')}</Label>
              <input id="name" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100" required />
            </div>

            {isParentSelectionLocked ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('categories.parent_category_locked_hint')}</p>
            ) : parentCategoryOptions.length > 0 && (
              <div>
                <SelectInput
                  label={t('categories.parent_category')}
                  id="parent_id"
                  value={formData.parent_id || ''}
                  options={[{ value: '', label: t('categories.parent_category_none') }, ...parentCategoryOptions]}
                  onChange={e => setFormData({ ...formData, parent_id: e.target.value || null })}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-200 dark:border-vindex-border">
              <Label htmlFor="budget_enabled" className="cursor-pointer">{t('categories.enable_budget')}</Label>
              <Switch
                id="budget_enabled"
                checked={formData.budget_enabled}
                onCheckedChange={checked => setFormData({ ...formData, budget_enabled: checked })}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="spending_limit">{t('categories.budget_optional')}</Label>
                <NumberInput id="spending_limit" value={formData.spending_limit} onChange={e => setFormData({ ...formData, spending_limit: e.target.value })} disabled={!formData.budget_enabled} />
              </div>
              <div className="flex-1">
                <SelectInput label={t('categories.budget_period')} id="budget_period" value={formData.budget_period} options={PERIOD_OPTIONS} onChange={e => setFormData({ ...formData, budget_period: e.target.value })} disabled={!formData.budget_enabled} />
              </div>
            </div>

            {formData.budget_enabled && Number(formData.spending_limit) > 0 && (
              <div>
                <Label className="mb-2 block text-xs text-gray-500 dark:text-gray-400">{t('categories.budget_breakdown')}</Label>
                <BudgetPeriodBreakdown amount={Number(formData.spending_limit)} period={formData.budget_period} />
              </div>
            )}

            <ColorPicker value={formData.color} onChange={color => setFormData({ ...formData, color })} />
            <IconSelector selectedIcon={formData.icon} onSelect={icon => setFormData({ ...formData, icon })} />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                variant="outline"
                className="flex-1 font-medium rounded-lg transition-colors bg-transparent"
                style={{ borderColor: SUCCESS, color: SUCCESS }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
              >
                {editingCategory ? t('common.update') : t('common.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-lg border transition-colors bg-transparent"
                style={{ borderColor: PRIMARY, color: PRIMARY }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description={t('categories.delete_confirm')}
        onConfirm={(e) => handleDelete(deleteId, e)}
      />
    </div>
  );
};

export default Categories;
