import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrashAlt as Trash2, X, FolderOpen as FolderEdit } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useFinance } from '@/context/FinanceContext';
import SelectInput from '@/components/ui/SelectInput';
import { formatCurrency } from '@/utils/calculations';
import { buildFlatIndentedOptions } from '@/utils/categoryTree';
import { SUCCESS, PRIMARY, DANGER } from '@/utils/colors';

const InvoiceItemSelectionBar = ({ selectedIds, items, onClearSelection, onRefresh }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { categories } = useFinance();
  const { toast } = useToast();

  const selectedItems = useMemo(() => items.filter(i => selectedIds.includes(i.id)), [items, selectedIds]);

  if (!selectedIds || selectedIds.length === 0) return null;

  const total = selectedItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalColor = total < 0 ? DANGER : total > 0 ? SUCCESS : undefined;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('invoice_detail.bulk_deleted_success_desc', { count: selectedIds.length }),
      });
      onClearSelection();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('invoice_detail.bulk_delete_error_title'),
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
        .from('invoice_items')
        .update({ category_id: selectedBulkCategory || null })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: t('invoice_detail.bulk_categories_updated_title'),
        description: t('invoice_detail.bulk_categories_updated_desc'),
      });
      onClearSelection();
      if (onRefresh) onRefresh();
      setShowCategoryModal(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('invoice_detail.bulk_update_error_title'),
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
            <p className="text-sm text-muted-foreground">{t('invoice_detail.bulk_selected_count', { count: selectedIds.length })}</p>
            <div className="mt-1">
              <span className="text-xs text-muted-foreground">{t('invoice_detail.bulk_total')}</span>
              <p className="font-bold text-lg" style={{ color: totalColor }}>{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto rounded-lg gap-2 border transition-colors bg-transparent"
            style={{ borderColor: SUCCESS, color: SUCCESS }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
            onClick={() => {
              setSelectedBulkCategory('');
              setShowCategoryModal(true);
            }}
          >
            <FolderEdit className="h-4 w-4" />
            <span className="truncate">{t('invoice_detail.bulk_change_category')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto rounded-lg gap-2 border transition-colors bg-transparent"
            style={{ borderColor: DANGER, color: DANGER }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="truncate">{t('invoice_detail.bulk_delete_button')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto rounded-lg gap-2 border transition-colors bg-transparent"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
            <span className="truncate">{t('common.cancel')}</span>
          </Button>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        title={t('invoice_detail.bulk_delete_confirm_title', { count: selectedIds.length })}
        description={t('invoice_detail.bulk_delete_confirm_desc')}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('invoice_detail.bulk_category_modal_title', { count: selectedIds.length })}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              {t('invoice_detail.bulk_new_category_label')}
            </label>
            <SelectInput
              value={selectedBulkCategory}
              onChange={(e) => setSelectedBulkCategory(e.target.value)}
              options={[
                { label: t('invoice_detail.bulk_no_category_option'), value: '' },
                ...buildFlatIndentedOptions(categories)
              ]}
              className="w-full"
              searchable
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBulkCategoryUpdate}
              disabled={isUpdating}
              className="flex-1 font-medium rounded-lg transition-colors bg-transparent"
              style={{ borderColor: SUCCESS, color: SUCCESS }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
            >
              {isUpdating ? t('common.saving') : t('invoice_detail.bulk_save_changes')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCategoryModal(false)}
              disabled={isUpdating}
              className="flex-1 rounded-lg border transition-colors bg-transparent"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceItemSelectionBar;
