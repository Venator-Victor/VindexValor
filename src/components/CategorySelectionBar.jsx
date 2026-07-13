import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { TrashAlt as Trash2, X } from '@/components/BxIcon';
import { useToast } from '@/components/ui/use-toast';
import { useFinance } from '@/context/FinanceContext';

// Categories are only ever one level deep (parent/child), so children never
// have children of their own — deleting all selected children first, then
// re-checking each selected parent against only its NON-selected children,
// is enough to let "select a parent + all its subcategories" delete the
// whole group in one go while still blocking a parent that still has
// subcategories left outside the selection.
const CategorySelectionBar = ({ selectedIds, categories, transactions, childrenByParentId, onClearSelection }) => {
  const { t } = useTranslation();
  const { deleteCategory } = useFinance();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!selectedIds || selectedIds.length === 0) return null;

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedSet = new Set(selectedIds);
    const childIds = selectedIds.filter(id => categories.find(c => c.id === id)?.parent_id);
    const parentIds = selectedIds.filter(id => !categories.find(c => c.id === id)?.parent_id);

    let deletedCount = 0;
    let skippedCount = 0;

    const tryDelete = async (id) => {
      const transactionCount = transactions.filter(t => t.category_id === id).length;
      if (transactionCount > 0) {
        skippedCount++;
        return;
      }
      try {
        await deleteCategory(id);
        deletedCount++;
      } catch {
        skippedCount++;
      }
    };

    for (const id of childIds) await tryDelete(id);

    for (const id of parentIds) {
      const remainingChildren = (childrenByParentId.get(id) || []).filter(c => !selectedSet.has(c.id));
      if (remainingChildren.length > 0) {
        skippedCount++;
        continue;
      }
      await tryDelete(id);
    }

    if (deletedCount > 0) {
      toast({
        title: t('common.success'),
        description: skippedCount > 0
          ? t('categories.bulk_deleted_partial_desc', { deleted: deletedCount, skipped: skippedCount })
          : t('categories.bulk_deleted_success_desc', { count: deletedCount }),
      });
    } else {
      toast({
        variant: "destructive",
        title: t('categories.bulk_delete_error_title'),
        description: t('categories.bulk_delete_all_skipped_desc'),
      });
    }

    setIsDeleting(false);
    setShowConfirmDelete(false);
    onClearSelection();
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background dark:bg-card border border-border shadow-xl rounded-2xl p-4 w-[92%] sm:w-auto max-w-2xl animate-in slide-in-from-bottom-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{t('categories.bulk_selected_count', { count: selectedIds.length })}</p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3">
          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="truncate">{t('categories.bulk_delete_button')}</span>
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

      <DeleteConfirmationDialog
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        title={t('categories.bulk_delete_confirm_title', { count: selectedIds.length })}
        description={t('categories.bulk_delete_confirm_desc')}
        onConfirm={handleBulkDelete}
        isLoading={isDeleting}
      />
    </>
  );
};

export default CategorySelectionBar;
