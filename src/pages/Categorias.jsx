import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List as ListIcon, Plus, Folder, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';
import SelectInput from '@/components/ui/SelectInput';
import NumberInput from '@/components/ui/NumberInput';
import { formatCurrency } from '@/utils/calculations';
import DefaultCategoriesModal from '@/components/DefaultCategoriesModal';
import GaugeChart from '@/components/GaugeChart';
import { useSortableList } from '@/hooks/useSortableList';
import CategoryDetailModal from '@/components/CategoryDetailModal';

const Categorias = () => {
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
    return localStorage.getItem('categorias_view_preference') || 'card';
  });
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#283768',
    icon: 'bx bx-tag',
    limite_gasto: '',
    periodo_limite: 'Mensal'
  });
  
  const periodOptions = [
    { label: "Diário", value: "Diário" }, 
    { label: "Semanal", value: "Semanal" }, 
    { label: "Quinzenal", value: "Quinzenal" }, 
    { label: "Mensal", value: "Mensal" }, 
    { label: "Trimestral", value: "Trimestral" }, 
    { label: "Semestral", value: "Semestral" }, 
    { label: "Anual", value: "Anual" }
  ];

  const handleLayoutChange = layout => {
    setDisplayLayout(layout);
    localStorage.setItem('categorias_view_preference', layout);
  };
  
  const handlePeriodChange = e => {
    const newPeriod = e.target.value;
    if (saveSettings) {
      saveSettings({ categorias_period_preference: newPeriod });
    }
  };
  
  const currentPeriod = settings?.categorias_period_preference || 'mensal';

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
  const activeCategories = sortedCategories.filter(cat => cat.limite_gasto && cat.limite_gasto > 0);
  const totalSpent = activeCategories.reduce((acc, cat) => acc + (cat.currentSpending || 0), 0);
  const totalBudget = activeCategories.reduce((acc, cat) => acc + (cat.limite_gasto || 0), 0);
  
  const handleSubmit = e => {
    e.preventDefault();
    const categoryData = {
      ...formData,
      limite_gasto: formData.limite_gasto ? Number(formData.limite_gasto) : null,
      periodo_limite: formData.periodo_limite
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
      limite_gasto: '',
      periodo_limite: 'Mensal'
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
      limite_gasto: category.limite_gasto || '',
      periodo_limite: category.periodo_limite || 'Mensal'
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const transactionCount = transactions.filter(t => t.categoria_id === category.id || t.categorias?.name === category.name || t.category === category.name).length;
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
  };

  const handleCardClick = (category) => {
    setSelectedDetailCategory(category);
  };
  
  const CYAN_COLOR = '#43CFEA';
  const CYAN_HOVER = '#2BA8C4';
  
  const SortIcon = ({ column }) => {
    if (!sortConfig || sortConfig.key !== column) return <div className="w-4 h-4" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  
  const SortableHeader = ({ label, column, className = "" }) => (
    <th className={`px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors ${className}`} onClick={() => requestSort(column)}>
      <div className="flex items-center gap-1">
        {label}
        <SortIcon column={column} />
      </div>
    </th>
  );
  
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - Categorias</title>
        <meta name="description" content="Organize suas transações com categorias personalizadas" />
      </Helmet>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Categorias</h1>
          <p className="text-gray-700 dark:text-gray-300">Orçamento mensal por categoria</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="w-full sm:w-40">
            <SelectInput 
              value={currentPeriod} 
              options={[
                { label: "Diário", value: "diario" }, 
                { label: "Semanal", value: "semanal" }, 
                { label: "Quinzenal", value: "quinzenal" }, 
                { label: "Mensal", value: "mensal" }, 
                { label: "Trimestral", value: "trimestral" }, 
                { label: "Semestral", value: "semestral" }, 
                { label: "Anual", value: "anual" }
              ]} 
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
            
            <Button onClick={() => setIsDefaultModalOpen(true)} className="border-none text-gray-900 rounded-lg flex-1 sm:flex-none whitespace-nowrap transition-colors" style={{ backgroundColor: CYAN_COLOR }} onMouseEnter={e => e.currentTarget.style.backgroundColor = CYAN_HOVER} onMouseLeave={e => e.currentTarget.style.backgroundColor = CYAN_COLOR}>
              <Plus className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Nova Categoria</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Chart Section - Updated with Gauge Chart */}
      <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm flex flex-col md:flex-row justify-around items-center gap-6">
         <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Utilização Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{formatCurrency(totalSpent)}</p>
         </div>
         
         <GaugeChart value={totalSpent} max={totalBudget > 0 ? totalBudget : 100} size={160} strokeWidth={16} className="my-2" label="" />

         <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Orçamento Total</p>
            <p className="text-2xl font-bold" style={{ color: CYAN_COLOR }}>{formatCurrency(totalBudget)}</p>
         </div>
      </div>

      {/* Categories List/Grid */}
      <div className="flex justify-between items-center mb-4 mt-6">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Minhas Categorias</h2>
         <span className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-vindex-bg px-2 py-1 rounded">
            Visualizando gastos: <span className="font-semibold capitalize text-gray-900 dark:text-gray-100">{currentPeriod}</span>
         </span>
      </div>
      
      {sortedCategories.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border border-dashed">
            <Folder className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-4">Você ainda não tem categorias cadastradas.</p>
            <Button onClick={() => setIsDefaultModalOpen(true)} className="text-gray-900" style={{ backgroundColor: CYAN_COLOR }}>Criar Primeira Categoria</Button>
         </div>
      ) : (
        <>
           {/* Grid View */}
           {displayLayout === 'card' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <AnimatePresence>
                 {sortedCategories.map((category, index) => {
                    const transactionCount = transactions.filter(t => t.categoria_id === category.id || t.categorias?.name === category.name || t.category === category.name).length;
                    
                    return (
                      <motion.div 
                        key={category.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9 }} 
                        transition={{ delay: index * 0.05 }} 
                        onClick={() => handleCardClick(category)}
                        className="bg-white dark:bg-vindex-card rounded-xl p-4 border border-gray-200 dark:border-vindex-border hover:border-blue-400 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full border-b border-gray-100 dark:border-vindex-border pb-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border shrink-0" style={{ backgroundColor: category.color + '22', borderColor: category.color + '44' }}>
                              <i className={`${category.icon} text-xl`} style={{ color: category.color }}></i>
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
                         <Button size="sm" onClick={(e) => handleEdit(category, e)} className="flex-1 h-8 text-xs font-medium border-none hover:opacity-90 transition-opacity text-gray-900" style={{ backgroundColor: CYAN_COLOR }}>
                           <Edit2 className="w-3 h-3 mr-1" />
                           Editar
                         </Button>
                         <Button size="sm" variant="outline" onClick={(e) => setDeleteId(category.id, e)} className="flex-1 h-8 text-xs font-medium bg-transparent hover:text-black transition-colors" style={{ borderColor: CYAN_COLOR, color: CYAN_COLOR }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = CYAN_COLOR; e.currentTarget.style.color = '#000'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = CYAN_COLOR; }}>
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
                            <SortableHeader label="Categoria" column="name" />
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Transações</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Utilização</th>
                            <SortableHeader label="Orçamento" column="limite_gasto" />
                            <SortableHeader label="Período" column="periodo_limite" />
                            <th className="px-6 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Ações</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                         {sortedCategories.map(category => {
                            const transactionCount = transactions.filter(t => t.categoria_id === category.id || t.categorias?.name === category.name || t.category === category.name).length;
                            const hasLimit = category.limite_gasto > 0;
                            
                            return (
                               <tr key={category.id} onClick={() => handleCardClick(category)} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors">
                                  <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: category.color + '22', color: category.color }}>
                                           <i className={`${category.icon} text-lg`}></i>
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
                                     {hasLimit ? <span>{formatCurrency(category.limite_gasto)}</span> : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                     {hasLimit ? <span className="text-xs capitalize">{category.periodo_limite}</span> : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <div className="flex justify-end gap-2">
                                        <Button size="sm" onClick={(e) => handleEdit(category, e)} className="h-8 w-8 p-0 rounded-lg text-gray-900" style={{ backgroundColor: CYAN_COLOR }}>
                                           <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={(e) => setDeleteId(category.id, e)} className="h-8 w-8 p-0 rounded-lg hover:text-black transition-colors" style={{ borderColor: CYAN_COLOR, color: CYAN_COLOR }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = CYAN_COLOR; e.currentTarget.style.color = '#000'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = CYAN_COLOR; }}>
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
                <Label htmlFor="limite_gasto">Orçamento (Opcional)</Label>
                <NumberInput id="limite_gasto" value={formData.limite_gasto} onChange={e => setFormData({ ...formData, limite_gasto: e.target.value })} />
              </div>
              <div className="flex-1">
                <SelectInput label="Período do Orçamento" id="periodo_limite" value={formData.periodo_limite} options={periodOptions} onChange={e => setFormData({ ...formData, periodo_limite: e.target.value })} />
              </div>
            </div>
            
            <ColorPicker value={formData.color} onChange={color => setFormData({ ...formData, color })} />
            <IconSelector selectedIcon={formData.icon} onSelect={icon => setFormData({ ...formData, icon })} />

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 font-medium rounded-lg border-none hover:text-white transition-colors text-black" style={{ backgroundColor: CYAN_COLOR }}>
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-lg transition-colors bg-transparent hover:text-black" style={{ borderColor: CYAN_COLOR, color: CYAN_COLOR }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = CYAN_COLOR; e.currentTarget.style.color = '#000'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = CYAN_COLOR; }}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-vindex-bg hover:bg-gray-200 dark:hover:bg-vindex-bg/80 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-gray-100 rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => handleDelete(deleteId, e)} className="bg-vindex-danger hover:bg-vindex-danger/90 rounded-lg text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categorias;