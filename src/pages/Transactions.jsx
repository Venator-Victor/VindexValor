import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Receipt as ReceiptText, Share as UploadCloud, Plus, Search, X, Filter } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import SelectInput from '@/components/ui/SelectInput';
import TransactionForm from '@/components/TransactionForm';
import CSVImportFlow from '@/components/CSVImportFlow';
import TransactionTable from '@/components/TransactionTable';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import TransactionSelectionModal from '@/components/TransactionSelectionModal';
import CategoryMappingManager from '@/components/CategoryMappingManager';
import FilterRangeInput, { parseValueFilterString } from '@/components/FilterRangeInput';
import InfoTooltip from '@/components/InfoTooltip';
import EmptyState from '@/components/EmptyState';
import DateFilterSelect from '@/components/ui/DateFilterSelect';
import { buildFlatIndentedOptions } from '@/utils/categoryTree';
import { getDateFilterDefaults, matchesDateFilter, isDateFilterActive } from '@/utils/dateFilter';

const Transactions = () => {
  const { t } = useTranslation();
  const { transactions, categories, accounts, isLoading, deleteTransaction } = useFinance();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedDetailTransaction, setSelectedDetailTransaction] = useState(null);
  
  const [filters, setFilters] = useState({ type: '', account_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [valueFilterStr, setValueFilterStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [dateFilter, setDateFilter] = useState(getDateFilterDefaults());

  useEffect(() => {
    if (location.state && transactions.length > 0) {
      let stateUpdated = false;
      
      if (location.state.filterCategoryId !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs from router navigation state (external system), then clears it via navigate() below.
        setSelectedCategoryId(location.state.filterCategoryId);
        stateUpdated = true;
      }
      
      if (location.state.editTransactionId) {
        const tToEdit = transactions.find(t => t.id === location.state.editTransactionId);
        if (tToEdit) {
          setEditingTransaction(tToEdit);
          setIsDialogOpen(true);
        }
        stateUpdated = true;
      }

      if (stateUpdated) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, transactions, navigate, location.pathname]);

  const filteredTransactions = useMemo(() => {
    const parsedValueFilter = parseValueFilterString(valueFilterStr);

    return transactions.filter(t => {
      const matchesType = !filters.type || t.type === filters.type;
      const matchesAccount = !filters.account_id || t.account_id === filters.account_id || t.destination_account_id === filters.account_id;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (t.description && t.description.toLowerCase().includes(searchLower));
      
      let matchesCategory = true;
      if (selectedCategoryId) {
        if (selectedCategoryId === 'null') {
          matchesCategory = !t.category_id;
        } else {
          matchesCategory = t.category_id === selectedCategoryId;
        }
      }

      let matchesValue = true;
      if (parsedValueFilter.isValid && parsedValueFilter.conditions.length > 0) {
        const absAmount = Math.abs(Number(t.amount));
        for (const cond of parsedValueFilter.conditions) {
          if (cond.op === '>') { if (!(absAmount > cond.val)) matchesValue = false; }
          else if (cond.op === '<') { if (!(absAmount < cond.val)) matchesValue = false; }
          else if (cond.op === '>=') { if (!(absAmount >= cond.val)) matchesValue = false; }
          else if (cond.op === '<=') { if (!(absAmount <= cond.val)) matchesValue = false; }
          else { if (!(absAmount === cond.val)) matchesValue = false; }
        }
      }

      const matchesDate = matchesDateFilter(t.date, dateFilter);

      return matchesType && matchesAccount && matchesSearch && matchesCategory && matchesValue && matchesDate;
    });
  }, [transactions, filters, searchTerm, valueFilterStr, selectedCategoryId, dateFilter]);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
      setSelectedDetailTransaction(null);
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleImportSuccess = (count) => {
    toast({
      title: t('transactions.import_success_title'),
      description: t('transactions.import_success_desc', { count }),
    });
    setIsImportOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setValueFilterStr('');
    setSelectedCategoryId('');
    setDateFilter(getDateFilterDefaults());
    setFilters({ tipo: '', account_id: '' });
  };

  const activeCount = [
    searchTerm ? 1 : 0,
    valueFilterStr ? 1 : 0,
    selectedCategoryId ? 1 : 0,
    filters.type ? 1 : 0,
    filters.account_id ? 1 : 0,
    isDateFilterActive(dateFilter) ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0 relative min-h-screen">
      <Helmet>
        <title>VindexValor - Transações</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('transactions.title')}</h1>
          <p className="text-muted-foreground">{t('transactions.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <DateFilterSelect value={dateFilter} onChange={setDateFilter} />

          <CategoryMappingManager />
          
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2 h-[42px]">
            <UploadCloud className="w-4 h-4" /> {t('transactions.import_csv')}
          </Button>

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="dialog-responsive max-w-[95vw] md:max-w-4xl p-4 md:p-6">
              <DialogHeader>
                <DialogTitle>{t('transactions.import_title')}</DialogTitle>
              </DialogHeader>
              <CSVImportFlow onSuccess={handleImportSuccess} onCancel={() => setIsImportOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-[42px]">
                <Plus className="w-4 h-4" /> {t('transactions.new')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? t('transactions.edit') : t('transactions.new')}</DialogTitle>
              </DialogHeader>
              <TransactionForm 
                initialData={editingTransaction} 
                onSuccess={handleFormSuccess} 
                onCancel={() => setIsDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Filter className="w-4 h-4" />
            {t('common.advanced_filters')}

            <InfoTooltip content={
              <div className="space-y-1 text-sm">
                <p><strong>{t('common.amount')}:</strong> {t('common.filter_value_hint')}</p>
                <p><strong>{t('common.description')}:</strong> {t('common.filter_desc_hint')}</p>
              </div>
            } />

            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-2">
                {activeCount > 1 ? t('common.active_filters_count_plural', { count: activeCount }) : t('common.active_filters_count', { count: activeCount })}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              {t('common.clear_filters')} <X className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="relative flex flex-col lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('common.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-md border border-input bg-background text-sm text-foreground outline-none hover:border-primary focus:border-primary h-[42px]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <FilterRangeInput
              value={valueFilterStr}
              onChange={setValueFilterStr}
            />
          </div>

          <div className="flex flex-col lg:col-span-1">
            <SelectInput
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={[
                { label: t('transactions.all_categories'), value: "" },
                { label: t('common.no_category'), value: "null" },
                ...buildFlatIndentedOptions(categories)
              ]}
              className="h-[42px]"
            />
          </div>

          <div className="flex flex-col lg:col-span-1">
            <SelectInput
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              options={[
                { label: t('transactions.all_types'), value: "" },
                { label: t('transactions.type_income'), value: "income" },
                { label: t('transactions.type_expense'), value: "expense" },
                { label: t('transactions.type_transfer'), value: "transfer" },
                { label: t('transactions.type_payment'), value: "payment" },
              ]}
              className="h-[42px]"
            />
          </div>

          <div className="flex flex-col lg:col-span-1">
            <SelectInput
              value={filters.account_id}
              onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
              options={[
                { label: t('transactions.all_accounts'), value: "" },
                ...accounts.map(a => ({ label: a.name, value: a.id }))
              ]}
              className="h-[42px]"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex justify-between items-center">
        <span>{t('transactions.showing_count', { count: filteredTransactions.length })}</span>
        {selectedIds.length > 0 && (
          <span className="selection-indicator-text text-sm font-medium">
            {selectedIds.length > 1
              ? t('common.selected_count_plural', { count: selectedIds.length })
              : t('common.selected_count', { count: selectedIds.length })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('transactions.loading')}</div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          message={t('transactions.no_transactions_yet')}
          buttonLabel={t('transactions.create_first')}
          onButtonClick={() => setIsDialogOpen(true)}
        />
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <ReceiptText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">{t('transactions.empty')}</p>
        </div>
      ) : (
        <TransactionTable
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
          onRowClick={(transaction) => setSelectedDetailTransaction(transaction)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <TransactionDetailModal
        isOpen={!!selectedDetailTransaction}
        onClose={() => setSelectedDetailTransaction(null)}
        transaction={selectedDetailTransaction}
        onEdit={(transaction) => handleEdit(transaction)}
        onDelete={(id) => { setSelectedDetailTransaction(null); setDeleteId(id); }}
      />

      <TransactionSelectionModal
        selectedIds={selectedIds} 
        transactions={transactions}
        onClearSelection={() => setSelectedIds([])}
        onRefresh={() => window.location.reload()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.delete_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transactions;