import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { TrashAlt as Trash2, X, Check } from '@/components/BxIcon';
import { useToast } from '@/components/ui/use-toast';
import { useFinance } from '@/context/FinanceContext';
import { PRIMARY, SUCCESS, DANGER } from '@/utils/colors';

// Only active subscriptions/salaries can have a payment registered this way — installment
// items settle through their own parcels, and an inactive item shouldn't post a new charge.
const isPayable = (item) => item.status === 'active' && item.recurrence_type !== 'installments';

const RecurrenceSelectionBar = ({ selectedIds, items, onClearSelection }) => {
  const { t } = useTranslation();
  const { deleteRecurring, processRecurring } = useFinance();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const selectedItems = useMemo(() => items.filter(i => selectedIds.includes(i.id)), [items, selectedIds]);
  const payableItems = useMemo(() => selectedItems.filter(isPayable), [selectedItems]);

  if (!selectedIds || selectedIds.length === 0) return null;

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    let deletedCount = 0;
    let skippedCount = 0;

    for (const id of selectedIds) {
      try {
        await deleteRecurring(id);
        deletedCount++;
      } catch {
        skippedCount++;
      }
    }

    if (deletedCount > 0) {
      toast({
        title: t('common.success'),
        description: skippedCount > 0
          ? t('recurrences.bulk_deleted_partial_desc', { deleted: deletedCount, skipped: skippedCount })
          : t('recurrences.bulk_deleted_success_desc', { count: deletedCount }),
      });
    } else {
      toast({ variant: "destructive", title: t('recurrences.bulk_delete_error_title'), description: t('recurrences.bulk_delete_all_failed_desc') });
    }

    setIsDeleting(false);
    setShowConfirmDelete(false);
    onClearSelection();
  };

  const handleBulkRegisterPayment = async () => {
    if (payableItems.length === 0) return;
    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of payableItems) {
      try {
        await processRecurring(item.id);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: t('recurrences.payment_registered_title'),
        description: errorCount > 0
          ? t('recurrences.bulk_payment_partial_desc', { success: successCount, failed: errorCount })
          : t('recurrences.bulk_payment_success_desc', { count: successCount }),
      });
    } else {
      toast({ variant: "destructive", title: t('recurrences.payment_error_title'), description: t('recurrences.bulk_payment_all_failed_desc') });
    }

    setIsProcessing(false);
    onClearSelection();
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background dark:bg-card border border-border shadow-xl rounded-2xl p-4 w-[92%] sm:w-auto max-w-2xl animate-in slide-in-from-bottom-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{t('recurrences.bulk_selected_count', { count: selectedIds.length })}</p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto rounded-lg gap-2 border transition-colors bg-transparent"
            style={{ borderColor: SUCCESS, color: SUCCESS }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; } }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
            disabled={isProcessing || payableItems.length === 0}
            onClick={handleBulkRegisterPayment}
          >
            <Check className="h-4 w-4" />
            <span className="truncate">
              {isProcessing ? t('recurrences.registering') : t('recurrences.bulk_register_payment_button', { count: payableItems.length })}
            </span>
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
            <span className="truncate">{t('recurrences.bulk_delete_button')}</span>
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
        title={t('recurrences.bulk_delete_confirm_title', { count: selectedIds.length })}
        description={t('recurrences.bulk_delete_confirm_desc')}
        onConfirm={handleBulkDelete}
        isLoading={isDeleting}
      />
    </>
  );
};

export default RecurrenceSelectionBar;
