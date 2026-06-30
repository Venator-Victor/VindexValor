import { PRIMARY, PRIMARY_HOVER } from '@/utils/colors';
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import BxIcon, { Grid as LayoutGrid, ListUl as ListIcon, Plus, Folder, TrashAlt as Trash2, Edit as Edit2 } from '@/components/BxIcon';
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
import { formatCurrency } from '@/utils/calculations';
import DefaultCategoriesModal from '@/components/DefaultCategoriesModal';
import GaugeSummaryCard from '@/components/GaugeSummaryCard';
import { useSortableList } from '@/hooks/useSortableList';
import { PERIOD_OPTIONS, CHART_PERIOD_OPTIONS } from '@/utils/periodOptions';
import CategoryDetailModal from '@/components/CategoryDetailModal';

const Categories = () => {
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
    settings,
    saveSettings,
    calculateSpendingForCategory
  } = useFinance();
  
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDetailCategory, setSelectedDetailCategory] = useState(null);
  
  const [displayLayout, setDisplayLayout] = useState(() => {
    return localStorage.getItem('categories_view_preference') || 'card';
  });
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#283768',
    icon: 'bx bx-tag',
    spending_limit: '',
    budget_period: 'Mensal'
  });
  

  const handleLayoutChange = layout => {
    setDisplayLayout(layout);
    localStorage.setItem('categories_view_preference', layout);
  };
  
  const handlePeriodChange = e => {
    const newPeriod = e.target.value;
    if (saveSettings) {
      saveSettings({ categories_period_preference: newPeriod });
    }
  };
  
  const currentPeriod = settings?.categories_period_preference || 'mensal';

  // Calculate dynamic spending based on global period preference
  const categoriesWithDynamicSpending = categories.map(cat => ({
    ...cat,
    currentSpending: calculateSpendingForCategory ? calculateSpendingForCategory(cat.name, currentPeriod, transactions) : 0
  }));

  // Sorting Hook
  const {
    items: sortedCategories,
    requestSort,
    sortConfig
  } = useSortableList(categoriesWithDynamicSpending);

  // Calculate totals for Chart
  const activeCategories = sortedCategories.filter(cat => cat.spending_limit && cat.spending_limit > 0);
  const totalSpent = activeCategories.reduce((acc, cat) => acc + (cat.currentSpending || 0), 0);
  const totalBudget = activeCategories.reduce((acc, cat) => acc + (cat.spending_limit || 0), 0);
  
  const handleSubmit = e => {
    e.preventDefault();
    const categoryData = {
      ...formData,
      spending_limit: formData.spending_limit ? Number(formData.spending_limit) : null,
      budget_period: formData.budget_period
    };
    if (editingCategory && updateCategory) {
      updateCategory(editingCategory.id, categoryData);
      toast({ title: "Categoria atualizada com sucesso!" });
    } else if (addCategory) {
      addCategory(categoryData);
      toast({ title: "Categoria criada com sucesso!" });
    }
    setIsDialogOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      color: '#283768',
      icon: 'bx bx-tag',
      spending_limit: '',
      budget_period: 'Mensal'
    });
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
      budget_period: category.budget_period || 'Mensal'
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const transactionCount = transactions.filter(t => t.category_id === category.id || t.categories?.name === category.name || t.category === category.name).length;
    if (transactionCount > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Esta categoria possui ${transactionCount} transação(ões) associada(s). Remova-as primeiro.`,
        variant: "destructive"
      });
      setDeleteId(null);
      return;
    }
    if (deleteCategory) {
      deleteCategory(id);
      toast({ title: "Categoria excluída com sucesso!" });
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
        <meta name="description" content="Organize suas transações com categorias personalizadas" />
      </Helmet>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Categories</h1>
          <p className="text-gray-700 dark:text-gray-300">Orçamento mensal por categoria</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="w-full sm:w-40">
            <SelectInput 
              value={currentPeriod} 
              options={CHART_PERIOD_OPTIONS}
              onChange={handlePeriodChange} 
              className="bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-300" 
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1">
              <button onClick={() => handleLayoutChange('list')} className={`p-2 rounded-md transition-all ${displayLayout === 'list' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                <ListIcon size={20} />
              </button>
              <button onClick={() => handleLayoutChange('card')} className={`p-2 rounded-md transition-all ${displayLayout === 'card' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                <LayoutGrid size={20} />
              </button>
            </div>
            
            <Button onClick={() => setIsDefaultModalOpen(true)} className="border-none text-gray-900 rounded-lg flex-1 sm:flex-none whitespace-nowrap transition-colors" style={{ backgroundColor: PRIMARY }} onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY_HOVER} onMouseLeave={e => e.currentTarget.style.backgroundColor = PRIMARY}>
              <Plus className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Nova Categoria</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </div>

      <GaugeSummaryCard
        leftLabel="Utilização Total"
        leftValue={formatCurrency(totalSpent)}
        gaugeValue={totalSpent}
        gaugeMax={totalBudget}
        rightLabel="Orçamento Total"
        rightValue={formatCurrency(totalBudget)}
        rightClassName="text-2xl font-bold text-primary"
      />

      {/* Categories List/Grid */}
      <div className="flex justify-between items-center mb-4 mt-6">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Minhas Categories</h2>
         <span className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-vindex-bg px-2 py-1 rounded">
            Visualizando gastos: <span className="font-semibold capitalize text-gray-900 dark:text-gray-100">{currentPeriod}</span>
         </span>
      </div>
      
      {sortedCategories.length === 0 ? (
        <EmptyState icon={Folder} message="Você ainda não tem categorias cadastradas." buttonLabel="Criar Primeira Categoria" onButtonClick={() => setIsDefaultModalOpen(true)} />
      ) : (
        <>
           {/* Grid View */}
           {displayLayout === 'card' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <AnimatePresence>
                 {sortedCategories.map((category, index) => {
                    const transactionCount = transactions.filter(t => t.category_id === category.id || t.categories?.name === category.name || t.category === category.name).length;
                    
                    return (
                      <motion.div 
                        key={category.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9 }} 
                        transition={{ delay: index * 0.05 }} 
                        onClick={() => handleCardClick(category)}
                        className="bg-white dark:bg-vindex-card rounded-xl p-4 border border-gray-200 dark:border-vindex-border transition-all shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
                        onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
                        onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                      >
                        <div className="flex items-center gap-3 w-full border-b border-gray-100 dark:border-vindex-border pb-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border shrink-0" style={{ backgroundColor: category.color + '22', borderColor: category.color + '44' }}>
                              <BxIcon iconClass={category.icon} size={20} style={{ color: category.color }} />
                            </div>
                            
                            <div className="text-left flex-grow overflow-hidden">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 leading-tight break-words" title={category.name}>{category.name}</h3>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{transactionCount} transações</p>
                            </div>
                        </div>

                        <div className="w-full p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-100 dark:border-vindex-border flex items-center justify-between mt-3">
                          <div className="text-left">
                            <span className="text-[10px] text-gray-700 dark:text-gray-300 block">Gasto Atual</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-50 block">{formatCurrency(category.currentSpending)}</span>
                          </div>
                        </div>

                       <div className="flex gap-2 w-full mt-4">
                         <Button size="sm" onClick={(e) => handleEdit(category, e)} className="flex-1 h-8 text-xs font-medium border-none hover:opacity-90 transition-opacity text-gray-900" style={{ backgroundColor: PRIMARY }}>
                           <Edit2 className="w-3 h-3 mr-1" />
                           Editar
                         </Button>
                         <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setDeleteId(category.id); }} className="flex-1 h-8 text-xs font-medium bg-transparent hover:text-black transition-colors" style={{ borderColor: PRIMARY, color: PRIMARY }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}>
                           <Trash2 className="w-3 h-3 mr-1" />
                           Excluir
                         </Button>
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
                            <SortableHeader label="Categoria" column="name" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Transações</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Utilização</th>
                            <SortableHeader label="Orçamento" column="spending_limit" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader label="Período" column="budget_period" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-6 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Ações</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                         {sortedCategories.map(category => {
                            const transactionCount = transactions.filter(t => t.category_id === category.id || t.categories?.name === category.name || t.category === category.name).length;
                            const hasLimit = category.spending_limit > 0;
                            
                            return (
                               <tr key={category.id} onClick={() => handleCardClick(category)} className="cursor-pointer transition-colors" onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                                  <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: category.color + '22', color: category.color }}>
                                           <BxIcon iconClass={category.icon} size={18} style={{ color: category.color }} />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-gray-50">{category.name}</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                     {transactionCount}
                                  </td>
                                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-50">
                                     {formatCurrency(category.currentSpending)}
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                     {hasLimit ? <span>{formatCurrency(category.spending_limit)}</span> : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                     {hasLimit ? <span className="text-xs capitalize">{category.budget_period}</span> : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <div className="flex justify-end gap-2">
                                        <Button size="sm" onClick={(e) => handleEdit(category, e)} className="h-8 w-8 p-0 rounded-lg text-gray-900" style={{ backgroundColor: PRIMARY }}>
                                           <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setDeleteId(category.id); }} className="h-8 w-8 p-0 rounded-lg hover:text-black transition-colors" style={{ borderColor: PRIMARY, color: PRIMARY }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}>
                                           <Trash2 className="h-4 w-4" />
                                        </Button>
                                     </div>
                                  </td>
                               </tr>
                            );
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
        transactions={transactions}
        onEdit={(cat) => handleEdit(cat, null)}
        onDelete={(id) => { setSelectedDetailCategory(null); setDeleteId(id); }}
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
               {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <input id="name" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100" required />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="spending_limit">Orçamento (Opcional)</Label>
                <NumberInput id="spending_limit" value={formData.spending_limit} onChange={e => setFormData({ ...formData, spending_limit: e.target.value })} />
              </div>
              <div className="flex-1">
                <SelectInput label="Período do Orçamento" id="budget_period" value={formData.budget_period} options={PERIOD_OPTIONS} onChange={e => setFormData({ ...formData, budget_period: e.target.value })} />
              </div>
            </div>
            
            <ColorPicker value={formData.color} onChange={color => setFormData({ ...formData, color })} />
            <IconSelector selectedIcon={formData.icon} onSelect={icon => setFormData({ ...formData, icon })} />

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 font-medium rounded-lg border-none hover:text-white transition-colors text-black" style={{ backgroundColor: PRIMARY }}>
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-lg transition-colors bg-transparent hover:text-black" style={{ borderColor: PRIMARY, color: PRIMARY }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
        onConfirm={(e) => handleDelete(deleteId, e)}
      />
    </div>
  );
};

export default Categories;