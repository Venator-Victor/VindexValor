import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TrashAlt as Trash2, X, FolderOpen as FolderEdit } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useFinance } from '@/context/FinanceContext';
import SelectInput from '@/components/ui/SelectInput';
import { formatCurrency, isCryptoCurrency } from '@/utils/calculations';

const TransactionSelectionModal = ({ selectedIds, transactions, onClearSelection, onRefresh }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { accounts, categories } = useFinance();
  const { toast } = useToast();

  const selectedTx = useMemo(() => transactions.filter(t => selectedIds.includes(t.id)), [transactions, selectedIds]);

  if (!selectedIds || selectedIds.length === 0) return null;

  let totalBRL = 0;
  let totalBTC = 0;

  selectedTx.forEach(t => {
    const acc = accounts.find(a => a.id === t.account_id || a.id === t.destination_account_id);
    const amount = t.type === 'expense' ? -Math.abs(t.amount) : t.type === 'income' ? Math.abs(t.amount) : 0;
    
    if (acc && isCryptoCurrency(acc.currency)) {
      totalBTC += amount;
    } else {
      totalBRL += amount;
    }
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('transactions.bulk_deleted_success_desc', { count: selectedIds.length }),
      });
      onClearSelection();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('transactions.bulk_delete_error_title'),
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: selectedBulkCategory || null })
        .in('id', selectedIds)
        .neq('type', 'payment')
        .neq('type', 'transfer');

      if (error) throw error;

      toast({
        title: t('transactions.bulk_categories_updated_title'),
        description: t('transactions.bulk_categories_updated_desc'),
      });
      onClearSelection();
      if (onRefresh) onRefresh();
      setShowCategoryModal(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('transactions.bulk_update_error_title'),
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background dark:bg-card border border-border shadow-xl rounded-2xl p-4 w-[92%] sm:w-auto max-w-2xl animate-in slide-in-from-bottom-10 flex flex-col gap-4">
        
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('transactions.bulk_selected_count', { count: selectedIds.length })}</p>
            <div className="flex gap-4 mt-1">
              {totalBRL !== 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('transactions.bulk_total_brl')}</span>
                  <p className={`font-bold text-lg ${totalBRL < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(totalBRL)}</p>
                </div>
              )}
              {totalBTC !== 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('transactions.bulk_total_btc')}</span>
                  <p className={`font-bold text-lg ${totalBTC < 0 ? 'text-red-500' : 'text-green-500'}`}>₿ {totalBTC.toFixed(8)}</p>
                </div>
              )}
              {totalBRL === 0 && totalBTC === 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('transactions.bulk_total')}</span>
                  <p className="font-bold text-lg text-foreground">{formatCurrency(0)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2 border-border"
            onClick={() => {
              setSelectedBulkCategory('');
              setShowCategoryModal(true);
            }}
          >
            <FolderEdit className="h-4 w-4" />
            <span className="truncate">{t('transactions.bulk_change_category')}</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="truncate">{t('transactions.bulk_delete_button')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
            <span className="truncate">{t('common.cancel')}</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.bulk_delete_confirm_title', { count: selectedIds.length })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.bulk_delete_confirm_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? t('transactions.bulk_deleting') : t('transactions.bulk_confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('transactions.bulk_category_modal_title', { count: selectedIds.length })}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              {t('transactions.bulk_new_category_label')}
            </label>
            <SelectInput
              value={selectedBulkCategory}
              onChange={(e) => setSelectedBulkCategory(e.target.value)}
              options={[
                { label: t('transactions.bulk_no_category_option'), value: '' },
                ...categories.map(c => ({ label: c.name, value: c.id }))
              ]}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)} disabled={isUpdating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBulkCategoryUpdate} disabled={isUpdating}>
              {isUpdating ? t('common.saving') : t('transactions.bulk_save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionSelectionModal;