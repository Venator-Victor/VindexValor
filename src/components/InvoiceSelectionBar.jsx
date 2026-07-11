import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrashAlt as Trash2, X, Eye, CreditCard } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { formatCurrency, formatCurrencyWithSymbol } from '@/utils/calculations';

const InvoiceSelectionBar = ({ selectedIds, invoices, invoiceTotals = {}, onClearSelection, onRefresh }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [eligiblePayments, setEligiblePayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentToConfirm, setPaymentToConfirm] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

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

  const fetchEligiblePayments = async () => {
    if (!user) return;
    setIsLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, account:accounts!fk_transacoes_conta(name, currency)')
        .eq('user_id', user.id)
        .in('type', ['payment', 'transfer'])
        .is('invoice_id', null)
        .order('date', { ascending: false });

      if (error) throw error;
      setEligiblePayments(data || []);
    } catch (err) {
      toast({ title: t('invoice_detail.fetch_payments_error'), description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleOpenPaymentModal = () => {
    if (!selectedInvoice) return;
    setIsPaymentModalOpen(true);
    fetchEligiblePayments();
  };

  const handlePickPayment = (payment) => {
    const paymentAmount = Math.abs(payment.amount);
    const invoiceTotal = Math.abs(selectedInvoiceTotal);
    const currencyMismatch = payment.account?.currency && selectedInvoiceAccount?.currency &&
      payment.account.currency !== selectedInvoiceAccount.currency;
    const amountsMatch = !currencyMismatch && Math.round(paymentAmount * 100) === Math.round(invoiceTotal * 100);

    if (!amountsMatch) {
      setPaymentToConfirm(payment);
      setIsConfirmDialogOpen(true);
    } else {
      linkPayment(payment.id);
    }
  };

  const linkPayment = async (paymentId) => {
    if (!selectedInvoice) return;
    setIsLinking(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ invoice_id: selectedInvoice.id })
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;

      const paymentRecord = eligiblePayments.find(p => p.id === paymentId) || paymentToConfirm;
      const amountPaid = paymentRecord ? Math.abs(paymentRecord.amount) : 0;

      if (amountPaid >= Math.abs(selectedInvoiceTotal)) {
        await supabase.from('invoices').update({ status: 'paid' }).eq('id', selectedInvoice.id).eq('user_id', user.id);
      }

      toast({ title: t('invoice_detail.payment_linked_success') });
      setIsPaymentModalOpen(false);
      setPaymentToConfirm(null);
      setIsConfirmDialogOpen(false);
      onClearSelection();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast({ title: t('invoice_detail.link_error'), description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleViewPurchases = () => {
    if (selectedIds.length === 1) {
      navigate(`/invoices/${selectedIds[0]}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('invoice_detail.link_payment_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {isLoadingPayments ? (
              <div className="text-center py-8 text-muted-foreground">{t('invoice_detail.loading_payments')}</div>
            ) : eligiblePayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                {t('invoice_detail.no_payments_available')}
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full min-w-[640px] text-sm border border-gray-200 dark:border-vindex-border rounded-lg overflow-hidden table-fixed">
                  <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                    <tr>
                      <th className="px-6 py-3 w-[14%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_date')}</th>
                      <th className="px-6 py-3 w-[34%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_description')}</th>
                      <th className="px-6 py-3 w-[20%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_account')}</th>
                      <th className="px-6 py-3 w-[18%] text-right font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_value')}</th>
                      <th className="px-6 py-3 w-[14%] text-center font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                    {eligiblePayments.map(p => {
                      const modalPayColor = p.amount < 0 ? 'text-red-600 dark:text-red-400' : p.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatDate(p.date)}</td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-50 truncate" title={p.description}>{p.description}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate">{p.account?.name || 'N/A'}</td>
                          <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${modalPayColor}`}>
                            {formatCurrencyWithSymbol(p.amount, p.account?.currency || 'BRL')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button size="sm" variant="outline" disabled={isLinking} onClick={() => handlePickPayment(p)}>
                              {t('invoice_detail.link_action')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('invoice_detail.divergent_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('invoice_detail.divergent_desc', {
                payment: paymentToConfirm && formatCurrency(Math.abs(paymentToConfirm.amount), paymentToConfirm.account?.currency || 'BRL'),
                total: formatCurrency(Math.abs(selectedInvoiceTotal), selectedInvoiceAccount?.currency || 'BRL')
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentToConfirm(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => linkPayment(paymentToConfirm?.id)}>{t('invoice_detail.confirm_link')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceSelectionBar;
