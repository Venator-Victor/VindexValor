import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { LayoutGrid, List as ListIcon, Repeat, Search, ArrowUp, ArrowDown } from 'lucide-react'; 
import { useFinance } from '@/context/FinanceContext';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/calculations';
import SelectInput from '@/components/ui/SelectInput';
import DatePicker from '@/components/ui/DatePicker';
import RecorrenciaCard from '@/components/cards/RecorrenciaCard';
import GaugeChart from '@/components/GaugeChart';
import DefaultCategoriesModal from '@/components/DefaultCategoriesModal';
import { useSortableList } from '@/hooks/useSortableList';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';

const Recorrencias = () => {
  const { recurring, parcels, updateRecurring, deleteRecurring, addRecurring, settings, saveSettings, transactionTypes } = useFinance();
  const { categories, addCategory } = useCategories();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    categoria_id: '',
    amount: '',
    frequency: 'Mensal',
    nextDate: new Date().toISOString().slice(0, 10),
    status: 'Ativo',
    transaction_type_id: '',
    numero_parcelas: ''
  });

  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    color: '#283768',
    icon: 'bx bx-tag'
  });

  const viewMode = settings.recorrencias_view_preference || 'list';
  const currentPeriod = settings.recorrencias_period_preference || 'mensal';

  const setViewMode = (mode) => {
    saveSettings({ recorrencias_view_preference: mode });
  };

  const periodOptions = [
    { label: "Diário", value: "diario" },
    { label: "Semanal", value: "semanal" },
    { label: "Quinzenal", value: "quinzenal" },
    { label: "Mensal", value: "mensal" },
  ];

  const handlePeriodChange = (e) => saveSettings({ recorrencias_period_preference: e.target.value });

  const frequencyOptions = [
    { label: "Diário", value: "Diário" },
    { label: "Semanal", value: "Semanal" },
    { label: "Quinzenal", value: "Quinzenal" },
    { label: "Mensal", value: "Mensal" },
    { label: "Trimestral", value: "Trimestral" },
    { label: "Semestral", value: "Semestral" },
    { label: "Anual", value: "Anual" }
  ];

  const statusOptions = [
      { label: "Ativo", value: "Ativo" },
      { label: "Inativo", value: "Inativo" }
  ];

  const categoryOptions = [
      { label: "Selecione...", value: "" },
      { label: "+ Nova Categoria", value: "__create_new__" },
      ...categories.map(cat => ({ label: cat.name, value: cat.id }))
  ];
  
  const typeOptions = [
      { label: "Selecione o tipo", value: "" },
      ...transactionTypes.map(t => ({ label: t.name, value: t.id }))
  ];

  const filteredRecurring = recurring.filter(() => true);
  const { items: sortedRecurring, requestSort, sortConfig } = useSortableList(filteredRecurring);

  const calculateGaugeData = () => {
     let totalPaid = 0;
     let totalPending = 0;
     if (parcels) {
        parcels.forEach(p => {
            if (p.paid_date) totalPaid += Number(p.amount);
            else totalPending += Number(p.amount);
        });
     }
     recurring.filter(r => r.status === true).forEach(r => {
         totalPending += Math.abs(Number(r.amount));
     });
     return { totalPaid, totalPending };
  };

  const { totalPaid, totalPending } = calculateGaugeData();
  const totalDebt = totalPaid + totalPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.transaction_type_id) {
       toast({ title: "Erro", description: "Por favor, selecione um tipo de transação (Salário, Assinatura ou Parcelamento)", variant: "destructive" });
       return;
    }
    
    const typeObj = transactionTypes.find(t => t.id === formData.transaction_type_id);
    const finalAmount = typeObj?.type === 'income' ? Math.abs(Number(formData.amount)) : -Math.abs(Number(formData.amount));
    const isParcelas = typeObj?.name === 'Parcelamento';
    const isActive = formData.status === 'Ativo';

    const recurringData = {
      description: formData.description,
      categoria_id: formData.categoria_id,
      amount: finalAmount,
      frequency: formData.frequency,
      nextDate: formData.nextDate,
      status: isActive,
      recurrence_type: isParcelas ? 'Parcelas' : 'Assinatura',
      numero_parcelas: isParcelas && formData.numero_parcelas ? parseInt(formData.numero_parcelas) : null
    };

    if (editingRecurring) {
      updateRecurring(editingRecurring.id, recurringData);
      toast({ title: "Recorrência atualizada com sucesso!" });
    } else {
      addRecurring(recurringData);
      toast({ title: "Solicitação enviada!", description: "Processando criação da recorrência..." });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      categoria_id: '',
      amount: '',
      frequency: 'Mensal',
      nextDate: new Date().toISOString().slice(0, 10),
      status: 'Ativo',
      transaction_type_id: '',
      numero_parcelas: ''
    });
    setEditingRecurring(null);
  };

  const handleEdit = (recurringItem) => {
    setEditingRecurring(recurringItem);
    
    // Attempt to guess transaction_type_id based on name/amount (since recurrences might not store it directly, but mapped from transacoes if needed)
    let guessedTypeId = '';
    if (recurringItem.recurrence_type === 'Parcelas') {
       guessedTypeId = transactionTypes.find(t => t.name === 'Parcelamento')?.id || '';
    } else if (Number(recurringItem.amount) > 0) {
       guessedTypeId = transactionTypes.find(t => t.name === 'Salário')?.id || '';
    } else {
       guessedTypeId = transactionTypes.find(t => t.name === 'Assinatura')?.id || '';
    }

    setFormData({
      description: recurringItem.description,
      categoria_id: recurringItem.categoria_id || '',
      amount: Math.abs(recurringItem.amount).toString(),
      frequency: recurringItem.frequency,
      nextDate: recurringItem.date || recurringItem.next_date,
      status: recurringItem.status === true ? 'Ativo' : 'Inativo',
      transaction_type_id: guessedTypeId,
      numero_parcelas: recurringItem.numero_parcelas || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    deleteRecurring(id);
    setDeleteId(null);
    toast({ title: "Recorrência excluída com sucesso!" });
  };

  const toggleStatus = (recurringItem) => {
    const newStatus = !recurringItem.status;
    updateRecurring(recurringItem.id, { ...recurringItem, status: newStatus });
    toast({ title: `Recorrência ${newStatus ? 'ativada' : 'desativada'} com sucesso!` });
  };
  
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === '__create_new__') setIsDefaultModalOpen(true);
    else setFormData(prev => ({ ...prev, categoria_id: value }));
  };

  const handleDefaultCategorySuccess = (categoryName, newCategory) => {
      if (newCategory && newCategory.id) {
          setFormData(prev => ({ ...prev, categoria_id: newCategory.id }));
          return;
      }
      const cat = categories.find(c => c.name === categoryName);
      if(cat) setFormData(prev => ({ ...prev, categoria_id: cat.id }));
      else toast({ title: "Categoria criada", description: "Por favor, selecione a nova categoria na lista." });
  };
  
  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    const newCat = await addCategory(newCategoryData);
    if (newCat) {
      setFormData(prev => ({ ...prev, categoria_id: newCat.id }));
      setIsCategoryDialogOpen(false);
      setNewCategoryData({ name: '', color: '#283768', icon: 'bx bx-tag' });
      toast({ title: "Categoria criada com sucesso!" });
    }
  };

  const CYAN_COLOR = '#43CFEA';
  const CYAN_HOVER = '#2BA8C4';

  const SortIcon = ({ column }) => {
    if (!sortConfig || sortConfig.key !== column) return <div className="w-4 h-4" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const SortableHeader = ({ label, column, className = "" }) => (
    <th 
      className={`px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors ${className}`}
      onClick={() => requestSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon column={column} />
      </div>
    </th>
  );
  
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - Recorrências</title>
        <meta name="description" content="Gerencie suas transações recorrentes" />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Recorrências</h1>
          <p className="text-gray-700 dark:text-gray-300">Gerencie contas fixas, parcelamentos e salários</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="w-full sm:w-40">
                <SelectInput value={currentPeriod} options={periodOptions} onChange={handlePeriodChange} className="bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-300" />
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                <ListIcon size={20} />
                </button>
                <button onClick={() => setViewMode('card')} className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                <LayoutGrid size={20} />
                </button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
                <DialogTrigger asChild>
                <Button 
                    onClick={resetForm} 
                    className="text-gray-900 rounded-lg flex-1 sm:flex-none whitespace-nowrap border-none"
                    style={{ backgroundColor: CYAN_COLOR }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = CYAN_HOVER}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = CYAN_COLOR}
                >
                    <i className='bx bx-plus mr-2 text-xl'></i>
                    <span className="hidden sm:inline">Nova Recorrência</span>
                    <span className="sm:hidden">Nova</span>
                </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingRecurring ? 'Editar Recorrência' : 'Nova Recorrência'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <SelectInput
                            label="Tipo de Recorrência *"
                            id="transaction_type_id"
                            value={formData.transaction_type_id}
                            options={typeOptions}
                            onChange={(e) => setFormData({ ...formData, transaction_type_id: e.target.value })}
                        />
                    </div>
                    <div>
                    <Label htmlFor="description">Descrição</Label>
                    <input
                        id="description"
                        type="text"
                        placeholder="Ex: Netflix, Aluguel, Compra TV"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-vindex-success/50 outline-none"
                        required
                    />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="amount">Valor da Parcela/Mensalidade</Label>
                         <div className="relative">
                           <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 font-medium">R$</span>
                           <input
                              id="amount"
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                              className="w-full pl-10 pr-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-vindex-success/50 outline-none"
                              required
                           />
                         </div>
                       </div>
                       <div>
                        <SelectInput
                           label="Categoria"
                           id="category"
                           value={formData.categoria_id}
                           options={categoryOptions}
                           onChange={handleCategoryChange}
                        />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       <div>
                         <SelectInput
                            label="Frequência"
                            id="frequency"
                            value={formData.frequency}
                            options={frequencyOptions}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                         />
                       </div>
                    </div>

                    {formData.transaction_type_id && transactionTypes.find(t => t.id === formData.transaction_type_id)?.name === 'Parcelamento' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <Label htmlFor="numero_parcelas">Quantidade de Parcelas</Label>
                             <input 
                                id="numero_parcelas"
                                type="number"
                                value={formData.numero_parcelas}
                                onChange={(e) => setFormData({ ...formData, numero_parcelas: e.target.value })}
                                placeholder="Ex: 12"
                                min={1}
                                className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-vindex-success/50 outline-none"
                             />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <DatePicker 
                            label="Data de Início / Próxima Cobrança"
                            value={formData.nextDate}
                            onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                            />
                        </div>
                        <div>
                        <SelectInput
                            label="Status"
                            id="status"
                            value={formData.status}
                            options={statusOptions}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white dark:bg-vindex-success/20 dark:hover:bg-vindex-success/30 dark:text-vindex-success dark:border dark:border-vindex-success/50 rounded-lg">
                        {editingRecurring ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-vindex-bg rounded-lg">
                        Cancelar
                    </Button>
                    </div>
                </form>
                </DialogContent>
            </Dialog>

            <DefaultCategoriesModal 
                isOpen={isDefaultModalOpen} 
                onClose={() => setIsDefaultModalOpen(false)} 
                onSuccess={handleDefaultCategorySuccess}
                onCreateCustom={() => {
                  setIsDefaultModalOpen(false);
                  setNewCategoryData({ name: '', color: '#283768', icon: 'bx bx-tag' });
                  setIsCategoryDialogOpen(true);
                }}
            />
            
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
                  <DialogHeader>
                      <DialogTitle>Nova Categoria Personalizada</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCustomCategory} className="space-y-4">
                      <div>
                        <Label>Nome</Label>
                        <input 
                            type="text" 
                            value={newCategoryData.name} 
                            onChange={(e) => setNewCategoryData({...newCategoryData, name: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 outline-none"
                            required
                        />
                      </div>
                      <ColorPicker value={newCategoryData.color} onChange={(color) => setNewCategoryData({...newCategoryData, color})} />
                      <IconSelector selectedIcon={newCategoryData.icon} onSelect={(icon) => setNewCategoryData({...newCategoryData, icon})} />
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1 bg-green-600 text-white hover:bg-green-700">Criar</Button>
                        <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="flex-1">Cancelar</Button>
                      </div>
                  </form>
                </DialogContent>
            </Dialog>

            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm flex flex-col md:flex-row justify-around items-center gap-6">
         <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pago até agora</p>
            <p className="text-2xl font-bold text-green-600 dark:text-vindex-success">{formatCurrency(totalPaid)}</p>
         </div>
         <GaugeChart value={totalPaid} max={totalDebt > 0 ? totalDebt : 100} size={140} strokeWidth={16} className="my-2" />
         <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Falta pagar</p>
            <p className="text-2xl font-bold text-red-600 dark:text-vindex-danger">{formatCurrency(totalPending)}</p>
         </div>
      </div>

      {sortedRecurring.length === 0 ? (
         <div className="text-center py-12 bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border border-dashed">
            <Repeat className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-4">Você ainda não tem recorrências cadastradas.</p>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>Criar Primeira Recorrência</Button>
         </div>
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRecurring.map(item => (
                <RecorrenciaCard key={item.id} item={item} onEdit={handleEdit} onDelete={() => setDeleteId(item.id)} onToggleStatus={toggleStatus} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                    <tr>
                      <SortableHeader label="Descrição" column="description" />
                      <SortableHeader label="Tipo" column="recurrence_type" />
                      <SortableHeader label="Valor" column="amount" />
                      <SortableHeader label="Frequência" column="frequency" />
                      <SortableHeader label="Próxima Cobrança" column="date" />
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                    {sortedRecurring.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                            <div className="flex flex-col">
                                <span>{item.description}</span>
                                <span className="text-xs text-gray-500">{item.categorias?.name || 'Sem categoria'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.recurrence_type === 'Parcelas' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                                 {item.recurrence_type || 'Assinatura'}
                             </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold ${Number(item.amount) > 0 ? 'text-green-600 dark:text-vindex-success' : 'text-red-600 dark:text-vindex-danger'}`}>
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-medium">{item.frequency}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-mono bg-gray-100 dark:bg-vindex-bg px-2 py-1 rounded">
                            {item.date || item.next_date ? new Date(item.date || item.next_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                            <button
                                onClick={() => toggleStatus(item)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors border ${
                                item.status
                                    ? 'bg-green-50 border-green-200 dark:bg-vindex-success/10 dark:border-vindex-success/30 text-green-700 dark:text-vindex-success hover:bg-green-100 dark:hover:bg-vindex-success/20'
                                    : 'bg-gray-50 border-gray-200 dark:bg-vindex-bg/50 dark:border-vindex-border/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-vindex-border'
                                }`}
                            >
                                {item.status ? 'Ativo' : 'Inativo'}
                            </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="hover:bg-gray-100 dark:hover:bg-vindex-border text-gray-700 dark:text-gray-300 border-gray-200 dark:border-vindex-border h-8 w-8 p-0 rounded-lg">
                              <i className='bx bx-pencil'></i>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteId(item.id)} className="hover:bg-red-50 dark:hover:bg-vindex-danger/20 hover:text-red-600 dark:hover:text-vindex-danger hover:border-red-200 dark:hover:border-vindex-danger/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-vindex-border h-8 w-8 p-0 rounded-lg">
                              <i className='bx bx-trash'></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir esta recorrência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-vindex-bg hover:bg-gray-200 dark:hover:bg-vindex-bg/80 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-gray-100 rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteId)} className="bg-red-600 hover:bg-red-700 dark:bg-vindex-danger dark:hover:bg-vindex-danger/90 text-white rounded-lg">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recorrencias;