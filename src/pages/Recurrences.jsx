import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, TEXT_SUCCESS, TEXT_DANGER } from '@/utils/colors';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Repeat, Search, Plus, Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import SortableHeader from '@/components/SortableHeader';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/calculations';
import SelectInput from '@/components/ui/SelectInput';
import DatePicker from '@/components/ui/DatePicker';
import NumberInput from '@/components/ui/NumberInput';
import ViewToggle from '@/components/ui/ViewToggle';
import DateFilterSelect from '@/components/ui/DateFilterSelect';
import { getDateFilterDefaults, matchesDateFilter } from '@/utils/dateFilter';
import RecorrenciaCard from '@/components/cards/RecurrenceCard';
import GaugeSummaryCard from '@/components/GaugeSummaryCard';
import DefaultCategoriesModal from '@/components/DefaultCategoriesModal';
import { useSortableList } from '@/hooks/useSortableList';
import { PERIOD_OPTIONS } from '@/utils/periodOptions';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';
import { buildFlatIndentedOptions } from '@/utils/categoryTree';

const Recurrences = () => {
  const { t, i18n } = useTranslation();
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
    category_id: '',
    amount: '',
    frequency: 'monthly',
    nextDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    transaction_type_id: '',
    installment_count: ''
  });

  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    color: '#283768',
    icon: 'bx bx-tag'
  });

  const viewMode = settings.recurring_items_view_preference || 'list';

  const setViewMode = (mode) => {
    saveSettings({ recurring_items_view_preference: mode });
  };

  const dateFilter = settings.recurring_items_date_filter || getDateFilterDefaults();
  const setDateFilter = (filter) => saveSettings({ recurring_items_date_filter: filter });

  const statusOptions = [
      { label: t('recurrences.status_active'), value: "active" },
      { label: t('recurrences.status_inactive'), value: "inactive" }
  ];

  const categoryOptions = [
      { label: t('common.select_placeholder'), value: "" },
      { label: t('recurrences.new_category_option'), value: "__create_new__" },
      ...buildFlatIndentedOptions(categories)
  ];

  const typeOptions = [
      { label: t('recurrences.select_type_placeholder'), value: "" },
      ...transactionTypes.map(tt => ({ label: tt.name, value: tt.id }))
  ];

  const filteredRecurring = recurring.filter(r => matchesDateFilter(r.date || r.next_date, dateFilter));
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
     recurring.filter(r => r.status === 'active').forEach(r => {
         totalPending += Math.abs(Number(r.amount));
     });
     return { totalPaid, totalPending };
  };

  const { totalPaid, totalPending } = calculateGaugeData();
  const totalDebt = totalPaid + totalPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.transaction_type_id) {
       toast({ title: t('common.error'), description: t('recurrences.select_type_error'), variant: "destructive" });
       return;
    }

    const typeObj = transactionTypes.find(tt => tt.id === formData.transaction_type_id);
    const finalAmount = typeObj?.type === 'income' ? Math.abs(Number(formData.amount)) : -Math.abs(Number(formData.amount));
    const isParcelas = typeObj?.name === 'Parcelamento';
    const isActive = formData.status === 'active';

    const recurringData = {
      description: formData.description,
      category_id: formData.category_id,
      amount: finalAmount,
      frequency: formData.frequency,
      nextDate: formData.nextDate,
      status: formData.status,
      recurrence_type: isParcelas ? 'installments' : 'subscription',
      installment_count: isParcelas && formData.installment_count ? parseInt(formData.installment_count) : null
    };

    if (editingRecurring) {
      updateRecurring(editingRecurring.id, recurringData);
      toast({ title: t('recurrences.updated_success') });
    } else {
      addRecurring(recurringData);
      toast({ title: t('recurrences.created_request'), description: t('recurrences.created_request_desc') });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      category_id: '',
      amount: '',
      frequency: 'monthly',
      nextDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      transaction_type_id: '',
      installment_count: ''
    });
    setEditingRecurring(null);
  };

  const handleEdit = (recurringItem) => {
    setEditingRecurring(recurringItem);
    
    // Attempt to guess transaction_type_id based on name/amount (since recurrences might not store it directly, but mapped from transacoes if needed)
    let guessedTypeId = '';
    if (recurringItem.recurrence_type === 'installments') {
       guessedTypeId = transactionTypes.find(tt => tt.name === 'Parcelamento')?.id || '';
    } else if (Number(recurringItem.amount) > 0) {
       guessedTypeId = transactionTypes.find(tt => tt.name === 'Salário')?.id || '';
    } else {
       guessedTypeId = transactionTypes.find(tt => tt.name === 'Assinatura' || tt.name === 'subscription')?.id || '';
    }

    setFormData({
      description: recurringItem.description,
      category_id: recurringItem.category_id || '',
      amount: Math.abs(recurringItem.amount).toString(),
      frequency: recurringItem.frequency,
      nextDate: recurringItem.date || recurringItem.next_date,
      status: recurringItem.status === 'active' ? 'active' : 'inactive',
      transaction_type_id: guessedTypeId,
      installment_count: recurringItem.installment_count || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    deleteRecurring(id);
    setDeleteId(null);
    toast({ title: t('recurrences.deleted_success') });
  };

  const toggleStatus = (recurringItem) => {
    const newStatus = recurringItem.status === 'active' ? 'inactive' : 'active';
    updateRecurring(recurringItem.id, { status: newStatus });
    toast({ title: newStatus === 'active' ? t('recurrences.activated_success') : t('recurrences.deactivated_success') });
  };
  
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === '__create_new__') setIsDefaultModalOpen(true);
    else setFormData(prev => ({ ...prev, category_id: value }));
  };

  const handleDefaultCategorySuccess = (categoryName, newCategory) => {
      if (newCategory && newCategory.id) {
          setFormData(prev => ({ ...prev, category_id: newCategory.id }));
          return;
      }
      const cat = categories.find(c => c.name === categoryName);
      if(cat) setFormData(prev => ({ ...prev, category_id: cat.id }));
      else toast({ title: t('recurrences.category_created_title'), description: t('recurrences.category_created_desc') });
  };

  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    const newCat = await addCategory(newCategoryData);
    if (newCat) {
      setFormData(prev => ({ ...prev, category_id: newCat.id }));
      setIsCategoryDialogOpen(false);
      setNewCategoryData({ name: '', color: '#283768', icon: 'bx bx-tag' });
      toast({ title: t('categories.created_success') });
    }
  };


  
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - {t('recurrences.title')}</title>
        <meta name="description" content={t('recurrences.subtitle')} />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('recurrences.title')}</h1>
          <p className="text-gray-700 dark:text-gray-300">{t('recurrences.subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <DateFilterSelect value={dateFilter} onChange={setDateFilter} />

            <div className="flex items-center gap-4">
                <ViewToggle value={viewMode} onChange={setViewMode} className="h-[42px]" />

            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
                <DialogTrigger asChild>
                <Button
                    onClick={resetForm}
                    className="text-gray-900 rounded-lg flex-1 sm:flex-none whitespace-nowrap border-none h-[42px]"
                    style={{ backgroundColor: PRIMARY }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_HOVER}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY}
                >
                    <Plus size={20} className="mr-2" />
                    <span className="hidden sm:inline">{t('recurrences.new')}</span>
                    <span className="sm:hidden">{t('recurrences.new_short')}</span>
                </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingRecurring ? t('recurrences.edit') : t('recurrences.new')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <SelectInput
                            label={t('recurrences.recurrence_type')}
                            id="transaction_type_id"
                            value={formData.transaction_type_id}
                            options={typeOptions}
                            onChange={(e) => setFormData({ ...formData, transaction_type_id: e.target.value })}
                        />
                    </div>
                    <div>
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <input
                        id="description"
                        type="text"
                        placeholder={t('recurrences.description_placeholder')}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="h-10 w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 hover:border-primary focus:border-primary outline-none"
                        required
                    />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="amount" className="min-h-[2.5rem] flex items-end">{t('recurrences.installment_amount')}</Label>
                         <div className="mt-1">
                           <NumberInput
                              id="amount"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                              currencyCode="BRL"
                           />
                         </div>
                       </div>
                       <div>
                        <SelectInput
                           label={t('common.category')}
                           labelClassName="min-h-[2.5rem] flex items-end"
                           id="category"
                           value={formData.category_id}
                           options={categoryOptions}
                           onChange={handleCategoryChange}
                        />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       <div>
                         <SelectInput
                            label={t('common.frequency')}
                            id="frequency"
                            value={formData.frequency}
                            options={PERIOD_OPTIONS}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                         />
                       </div>
                    </div>

                    {formData.transaction_type_id && transactionTypes.find(tt => tt.id === formData.transaction_type_id)?.name === 'Parcelamento' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <Label htmlFor="installment_count">{t('recurrences.installment_count')}</Label>
                             <input
                                id="installment_count"
                                type="number"
                                value={formData.installment_count}
                                onChange={(e) => setFormData({ ...formData, installment_count: e.target.value })}
                                placeholder={t('recurrences.installment_count_placeholder')}
                                min={1}
                                className="h-10 w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 hover:border-primary focus:border-primary outline-none no-spinner"
                             />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <DatePicker
                            label={t('recurrences.start_date')}
                            labelClassName="min-h-[2.5rem] flex items-end"
                            value={formData.nextDate}
                            onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                            />
                        </div>
                        <div>
                        <SelectInput
                            label={t('common.status')}
                            labelClassName="min-h-[2.5rem] flex items-end"
                            id="status"
                            value={formData.status}
                            options={statusOptions}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                    <Button
                        type="submit"
                        variant="outline"
                        className="flex-1 font-medium rounded-lg transition-colors bg-transparent"
                        style={{ borderColor: SUCCESS, color: SUCCESS }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
                    >
                        {editingRecurring ? t('common.update') : t('common.create')}
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
                <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl sm:max-w-[500px]">
                  <DialogHeader>
                      <DialogTitle>{t('recurrences.new_custom_category')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCustomCategory} className="space-y-4">
                      <div>
                        <Label>{t('common.name')}</Label>
                        <input
                            type="text"
                            value={newCategoryData.name}
                            onChange={(e) => setNewCategoryData({...newCategoryData, name: e.target.value})}
                            className="h-10 w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 outline-none"
                            required
                        />
                      </div>
                      <ColorPicker value={newCategoryData.color} onChange={(color) => setNewCategoryData({...newCategoryData, color})} />
                      <IconSelector selectedIcon={newCategoryData.icon} onSelect={(icon) => setNewCategoryData({...newCategoryData, icon})} />
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">{t('common.create')}</Button>
                        <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="flex-1">{t('common.cancel')}</Button>
                      </div>
                  </form>
                </DialogContent>
            </Dialog>

            </div>
        </div>
      </div>

      <GaugeSummaryCard
        leftLabel={t('recurrences.paid_so_far')}
        leftValue={formatCurrency(totalPaid)}
        gaugeValue={totalPaid}
        gaugeMax={totalDebt}
        rightLabel={t('recurrences.left_to_pay')}
        rightValue={formatCurrency(totalPending)}
        rightClassName={totalPending === 0 ? TEXT_SUCCESS : TEXT_DANGER}
        mode="progress"
      />

      {sortedRecurring.length === 0 ? (
        <EmptyState icon={Repeat} message={t('recurrences.empty')} buttonLabel={t('recurrences.create_first')} onButtonClick={() => { resetForm(); setIsDialogOpen(true); }} />
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRecurring.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RecorrenciaCard item={item} onEdit={handleEdit} onDelete={() => setDeleteId(item.id)} onToggleStatus={toggleStatus} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed">
                  <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                    <tr>
                      <SortableHeader label={t('recurrences.col_description')} column="description" sortConfig={sortConfig} onSort={requestSort} className="w-[28%]" />
                      <SortableHeader label={t('recurrences.col_type')} column="recurrence_type" sortConfig={sortConfig} onSort={requestSort} className="w-[14%]" />
                      <SortableHeader label={t('recurrences.col_amount')} column="amount" sortConfig={sortConfig} onSort={requestSort} className="w-[14%]" />
                      <SortableHeader label={t('recurrences.col_frequency')} column="frequency" sortConfig={sortConfig} onSort={requestSort} className="w-[13%]" />
                      <SortableHeader label={t('recurrences.col_next_billing')} column="date" sortConfig={sortConfig} onSort={requestSort} className="w-[14%]" />
                      <th className="px-6 py-3 w-[10%] text-left font-medium text-gray-700 dark:text-gray-300">{t('recurrences.col_status')}</th>
                      <th className="px-6 py-3 w-[7%] text-right font-medium text-gray-700 dark:text-gray-300">{t('recurrences.col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                    {sortedRecurring.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                            <div className="flex flex-col min-w-0">
                                <span className="truncate" title={item.description}>{item.description}</span>
                                <span className="text-xs text-gray-500 truncate">{item.categories?.name || t('common.no_category')}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.recurrence_type === 'installments' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                                 {t(`recurrences.type_${item.recurrence_type || 'subscription'}`)}
                             </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold ${Number(item.amount) > 0 ? 'text-green-600 dark:text-vindex-success' : 'text-red-600 dark:text-vindex-danger'}`}>
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-medium">{t(`period.${item.frequency}`, item.frequency)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-mono bg-gray-100 dark:bg-vindex-bg px-2 py-1 rounded">
                            {item.date || item.next_date ? new Date(item.date || item.next_date).toLocaleDateString(i18n.language) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                            <button
                                onClick={() => toggleStatus(item)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors border ${
                                item.status === 'active'
                                    ? 'bg-green-50 border-green-200 dark:bg-vindex-success/10 dark:border-vindex-success/30 text-green-700 dark:text-vindex-success hover:bg-green-100 dark:hover:bg-vindex-success/20'
                                    : 'bg-gray-50 border-gray-200 dark:bg-vindex-bg/50 dark:border-vindex-border/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-vindex-border'
                                }`}
                            >
                                {item.status === 'active' ? t('recurrences.status_active') : t('recurrences.status_inactive')}
                            </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
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
                              onClick={() => setDeleteId(item.id)}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description={t('recurrences.delete_confirm')}
        onConfirm={() => handleDelete(deleteId)}
      />
    </div>
  );
};

export default Recurrences;