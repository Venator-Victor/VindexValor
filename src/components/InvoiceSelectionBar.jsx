import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { TrashAlt as Trash2, X, Eye, CreditCard } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { formatCurrency } from '@/utils/calculations';
import InvoicePaymentLinkModal from '@/components/InvoicePaymentLinkModal';

const InvoiceSelectionBar = ({ selectedIds, invoices, invoiceTotals = {}, onClearSelection, onRefresh }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { accounts } = useFinance();
  const { user } = useAuth();

  const { toast } = useToast();
  const navigate = useNavigate();

  if (!selectedIds || selectedIds.length === 0) return null;

  const totalBRL = selectedIds.reduce((sum, id) => sum + (invoiceTotals[id] || 0), 0);
  const totalBTC = 0; // Calculado futuramente, atualmente mockado como 0

  const selectedInvoice = selectedIds.length === 1 ? invoices.find(f => f.id === selectedIds[0]) : null;
  const selectedInvoiceTotal = selectedInvoice ? (invoiceTotals[selectedInvoice.id] || 0) : 0;
  const selectedInvoiceAccount = selectedInvoice ? accounts.find(a => a.id === selectedInvoice.account_id) : null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Unlink any payments first: invoice_items cascade-delete automatically, but
      // transactions.invoice_id has no cascade, so deleting would fail with an FK error otherwise.
      await supabase.from('transactions').update({ invoice_id: null }).in('invoice_id', selectedIds).eq('user_id', user.id);

      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('invoices.bulk_deleted_success', { count: selectedIds.length }),
      });
      onClearSelection();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('invoices.delete_error'),
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleOpenPaymentModal = () => {
    if (!selectedInvoice) return;
    setIsPaymentModalOpen(true);
  };

  const handlePaymentLinked = () => {
    onClearSelection();
    if (onRefresh) onRefresh();
  };

  const handleViewPurchases = () => {
    if (selectedIds.length === 1) {
      navigate(`/invoices/${selectedIds[0]}`);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background dark:bg-card border border-border shadow-xl rounded-2xl p-4 w-[92%] sm:w-auto max-w-2xl animate-in slide-in-from-bottom-10 flex flex-col gap-4">

        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('invoices.selected_invoices_count', { count: selectedIds.length })}</p>
            <div className="flex gap-4 mt-1">
              {totalBRL !== 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('invoices.total_brl')}</span>
                  <p className={`font-bold text-lg ${totalBRL < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(totalBRL)}</p>
                </div>
              )}
              {totalBTC !== 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('invoices.total_btc')}</span>
                  <p className="font-bold text-lg text-foreground">₿ {totalBTC.toFixed(8)}</p>
                </div>
              )}
              {totalBRL === 0 && totalBTC === 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('common.total')}</span>
                  <p className="font-bold text-lg text-foreground">{formatCurrency(0)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3">
          {selectedIds.length === 1 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2 border-border"
              onClick={handleOpenPaymentModal}
            >
              <CreditCard className="h-4 w-4" />
              <span className="truncate">{t('invoice_detail.select_payment')}</span>
            </Button>
          )}

          {selectedIds.length === 1 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2 border-border"
              onClick={handleViewPurchases}
            >
              <Eye className="h-4 w-4" />
              <span className="truncate">{t('invoices.view_purchases')}</span>
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="truncate">{t('common.delete')}</span>
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
        title={t('invoices.delete_bulk_title', { count: selectedIds.length })}
        description={t('invoices.delete_bulk_desc')}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {selectedInvoice && (
        <InvoicePaymentLinkModal
          isOpen={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          invoiceId={selectedInvoice.id}
          invoiceTotal={selectedInvoiceTotal}
          invoiceCurrency={selectedInvoiceAccount?.currency}
          onLinked={handlePaymentLinked}
        />
      )}
    </>
  );
};

export default InvoiceSelectionBar;
