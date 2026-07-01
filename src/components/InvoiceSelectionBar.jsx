import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TrashAlt as Trash2, X, Eye, CreditCard } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import SelectInput from '@/components/ui/SelectInput';
import { formatCurrency } from '@/utils/calculations';

const InvoiceSelectionBar = ({ selectedIds, invoices, invoiceTotals = {}, onClearSelection, onRefresh }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  
  const { accounts } = useFinance();
  const { user } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!selectedIds || selectedIds.length === 0) return null;

  const totalBRL = selectedIds.reduce((sum, id) => sum + (invoiceTotals[id] || 0), 0);
  const totalBTC = 0; // Calculado futuramente, atualmente mockado como 0

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
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

  const handleSelectPayment = () => {
    setIsPaymentModalOpen(true);
  };
  
  const handleConfirmPayment = async () => {
    if (!selectedAccountId) {
      toast({ title: t('invoices.select_account_error_title'), variant: "destructive", description: t('invoices.select_account_error_desc') });
      return;
    }
    
    setIsLinking(true);
    try {
      const transactionsToInsert = selectedIds.map(id => {
        const fatura = invoices.find(f => f.id === id);
        const total = invoiceTotals[id] || 0;
        return {
          user_id: user.id,
          description: t('invoices.payment_description', { number: fatura?.invoice_number || '' }),
          amount: -Math.abs(total), 
          type: 'payment',
          date: new Date().toISOString().split('T')[0],
          account_id: selectedAccountId,
          invoice_id: id
        };
      });

      if (transactionsToInsert.length > 0) {
        const { error: txError } = await supabase.from('transactions').insert(transactionsToInsert);
        if (txError) throw txError;
      }

      const { error: statusError } = await supabase.from('invoices').update({ status: 'paid' }).in('id', selectedIds).eq('user_id', user.id);
      if (statusError) throw statusError;

      toast({ title: t('common.success'), description: t('invoices.payment_linked_bulk_success') });
      setIsPaymentModalOpen(false);
      setSelectedAccountId('');
      onClearSelection();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast({ title: t('invoices.link_bulk_error'), description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleViewPurchases = () => {
    if (selectedIds.length === 1) {
      navigate(`/faturas/${selectedIds[0]}`);
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
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2 border-border"
            onClick={handleSelectPayment}
            disabled={selectedIds.length === 0}
          >
            <CreditCard className="h-4 w-4" />
            <span className="truncate">{t('invoice_detail.select_payment')}</span>
          </Button>

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

      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('invoices.delete_bulk_title', { count: selectedIds.length })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('invoices.delete_bulk_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? t('common.deleting') : t('common.confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('invoices.link_payment_title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t('invoices.payment_select_desc', { count: selectedIds.length })}
            </p>
            <SelectInput
              label={t('invoices.payment_account_label')}
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              options={accounts.map(a => ({ label: a.name, value: a.id }))}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleConfirmPayment} disabled={isLinking}>
              {isLinking ? t('common.linking') : t('invoices.confirm_payment_action')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceSelectionBar;