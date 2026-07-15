import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import SelectInput from '@/components/ui/SelectInput';
import FilterRangeInput, { parseValueFilterString } from '@/components/FilterRangeInput';
import { formatCurrency, formatCurrencyWithSymbol } from '@/utils/calculations';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useFinance } from '@/context/FinanceContext';
import SortIcon from '@/components/SortIcon';
import { PRIMARY, DANGER, SUCCESS } from '@/utils/colors';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// Shared "link an existing transaction to an invoice" picker, used from both the
// invoice detail page (single invoice) and the invoices list bulk selection bar
// (also single invoice — bulk linking doesn't have a clean 1:1 match).
const InvoicePaymentLinkModal = ({ isOpen, onOpenChange, invoiceId, invoiceTotal, invoiceCurrency, onLinked }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { categories } = useFinance();

  const [eligiblePayments, setEligiblePayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [valueFilterStr, setValueFilterStr] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [paymentToConfirm, setPaymentToConfirm] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  // An invoice already settled — either by a transaction already linked to it, or by a
  // CSV-imported is_payment line — can't also take a second linked payment, or the same
  // real-world payment gets counted twice. Credit card statements settle one billing
  // cycle late, so a payment line that pays off THIS invoice's debt physically lives in
  // invoice_items on its *successor* (the next invoice for the same account), not on
  // this invoice itself — see computeInvoiceBalances.
  const [alreadySettledReason, setAlreadySettledReason] = useState(null); // 'linked' | 'item' | null
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);

  const fetchEligiblePayments = async () => {
    if (!user) return;
    setIsLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, account:accounts!fk_transacoes_conta(name, currency), categories(name, color)')
        .eq('user_id', user.id)
        .in('type', ['expense', 'payment', 'transfer'])
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

  const checkAlreadySettled = async () => {
    setIsCheckingExisting(true);
    try {
      const { data: existingLinked } = await supabase
        .from('transactions')
        .select('id')
        .eq('invoice_id', invoiceId)
        .limit(1);
      if ((existingLinked || []).length > 0) {
        setAlreadySettledReason('linked');
        return;
      }

      const { data: thisInvoice } = await supabase
        .from('invoices')
        .select('id, account_id, closing_date, opening_date')
        .eq('id', invoiceId)
        .single();
      if (!thisInvoice) {
        setAlreadySettledReason(null);
        return;
      }

      const { data: accountInvoices } = await supabase
        .from('invoices')
        .select('id, closing_date, opening_date')
        .eq('account_id', thisInvoice.account_id);

      const sorted = [...(accountInvoices || [])].sort((a, b) =>
        new Date(a.closing_date) - new Date(b.closing_date) || new Date(a.opening_date) - new Date(b.opening_date)
      );
      const idx = sorted.findIndex(inv => inv.id === invoiceId);
      const successor = idx >= 0 ? sorted[idx + 1] : null;

      if (!successor) {
        setAlreadySettledReason(null);
        return;
      }

      const { data: successorItems } = await supabase
        .from('invoice_items')
        .select('id')
        .eq('invoice_id', successor.id)
        .eq('is_payment', true)
        .limit(1);
      setAlreadySettledReason((successorItems || []).length > 0 ? 'item' : null);
    } finally {
      setIsCheckingExisting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets filters when the modal is reopened for a (possibly different) invoice.
      setCategoryFilter('');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see above.
      setValueFilterStr('');
      fetchEligiblePayments();
      checkAlreadySettled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoiceId]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const parsedValueFilter = valueFilterStr ? parseValueFilterString(valueFilterStr) : null;

  const visiblePayments = eligiblePayments
    .filter(p => !categoryFilter || p.category_id === categoryFilter)
    .filter(p => {
      if (!parsedValueFilter || !parsedValueFilter.isValid || parsedValueFilter.conditions.length === 0) return true;
      const absAmount = Math.abs(Number(p.amount));
      return parsedValueFilter.conditions.every(cond => {
        if (cond.op === '>') return absAmount > cond.val;
        if (cond.op === '<') return absAmount < cond.val;
        if (cond.op === '>=') return absAmount >= cond.val;
        if (cond.op === '<=') return absAmount <= cond.val;
        return absAmount === cond.val;
      });
    })
    .sort((a, b) => {
      let aValue, bValue;
      if (sortConfig.key === 'date') {
        aValue = new Date(a.date || 0).getTime();
        bValue = new Date(b.date || 0).getTime();
      } else if (sortConfig.key === 'description') {
        aValue = a.description || '';
        bValue = b.description || '';
      } else if (sortConfig.key === 'category') {
        aValue = a.categories?.name || '';
        bValue = b.categories?.name || '';
      } else if (sortConfig.key === 'account') {
        aValue = a.account?.name || '';
        bValue = b.account?.name || '';
      } else if (sortConfig.key === 'amount') {
        aValue = Number(a.amount || 0);
        bValue = Number(b.amount || 0);
      }
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

  const handlePickPayment = (payment) => {
    const paymentAmount = Math.abs(payment.amount);
    const invoiceTotalAbs = Math.abs(invoiceTotal);
    const currencyMismatch = payment.account?.currency && invoiceCurrency &&
      payment.account.currency !== invoiceCurrency;
    const amountsMatch = !currencyMismatch && Math.round(paymentAmount * 100) === Math.round(invoiceTotalAbs * 100);

    if (!amountsMatch) {
      setPaymentToConfirm(payment);
      setIsConfirmDialogOpen(true);
    } else {
      linkPayment(payment.id);
    }
  };

  const linkPayment = async (paymentId) => {
    setIsLinking(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ invoice_id: invoiceId })
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;

      const paymentRecord = eligiblePayments.find(p => p.id === paymentId) || paymentToConfirm;
      const amountPaid = paymentRecord ? Math.abs(paymentRecord.amount) : 0;

      if (amountPaid >= Math.abs(invoiceTotal)) {
        await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId).eq('user_id', user.id);
      }

      toast({ title: t('invoice_detail.payment_linked_success') });
      setPaymentToConfirm(null);
      setIsConfirmDialogOpen(false);
      onOpenChange(false);
      if (onLinked) onLinked();
    } catch (err) {
      toast({ title: t('invoice_detail.link_error'), description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-[98vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>{t('invoice_detail.link_payment_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {isCheckingExisting ? (
              <div className="text-center py-8 text-muted-foreground">{t('invoice_detail.loading_payments')}</div>
            ) : alreadySettledReason ? (
              <div className="text-center py-8 px-4 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                {alreadySettledReason === 'linked'
                  ? t('invoice_detail.already_settled_via_linked')
                  : t('invoice_detail.already_settled_via_item')}
              </div>
            ) : (
              <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:max-w-xs">
                <SelectInput
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  placeholder={t('transactions.all_categories')}
                  options={categories.map(c => ({ label: c.name, value: c.id }))}
                  className="h-[42px]"
                  searchable
                />
              </div>
              <div className="w-full sm:max-w-xs">
                <FilterRangeInput value={valueFilterStr} onChange={setValueFilterStr} />
              </div>
            </div>

            {isLoadingPayments ? (
              <div className="text-center py-8 text-muted-foreground">{t('invoice_detail.loading_payments')}</div>
            ) : visiblePayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                {t('invoice_detail.no_payments_available')}
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Mobile: stacked cards, no horizontal scrolling needed */}
                <div className="md:hidden space-y-2">
                  {visiblePayments.map(p => {
                    const cardPayColor = p.amount < 0 ? DANGER : p.amount > 0 ? SUCCESS : undefined;
                    return (
                      <div key={p.id} className="border border-gray-200 dark:border-vindex-border rounded-lg p-3 bg-white dark:bg-vindex-card">
                        <div className="flex justify-between items-start gap-2 min-w-0">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-50 truncate" title={p.description}>{p.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{formatDate(p.date)} · {p.account?.name || 'N/A'}</p>
                          </div>
                          <p className="font-semibold whitespace-nowrap shrink-0" style={{ color: cardPayColor }}>
                            {formatCurrencyWithSymbol(p.amount, p.account?.currency || 'BRL')}
                          </p>
                        </div>
                        <div className="flex justify-between items-center gap-2 mt-2">
                          {p.categories ? (
                            <div className="flex items-center gap-1.5 min-w-0 text-xs">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.categories.color }} />
                              <span className="truncate text-gray-700 dark:text-gray-300">{p.categories.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">{t('common.no_category')}</span>
                          )}
                          <Button size="sm" variant="outline" disabled={isLinking} onClick={() => handlePickPayment(p)} className="shrink-0">
                            {t('invoice_detail.link_action')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop/tablet: sortable table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm border border-gray-200 dark:border-vindex-border rounded-lg overflow-hidden table-fixed">
                    <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                      <tr>
                        <th className="px-6 py-3 w-[12%] text-left font-medium text-gray-700 dark:text-gray-300">
                          <button onClick={() => requestSort('date')} className="flex items-center hover:text-foreground">
                            {t('invoice_detail.col_date')} <SortIcon column="date" sortConfig={sortConfig} />
                          </button>
                        </th>
                        <th className="px-6 py-3 w-[24%] text-left font-medium text-gray-700 dark:text-gray-300">
                          <button onClick={() => requestSort('description')} className="flex items-center hover:text-foreground">
                            {t('invoice_detail.col_description')} <SortIcon column="description" sortConfig={sortConfig} />
                          </button>
                        </th>
                        <th className="px-6 py-3 w-[16%] text-left font-medium text-gray-700 dark:text-gray-300">
                          <button onClick={() => requestSort('category')} className="flex items-center hover:text-foreground">
                            {t('common.category')} <SortIcon column="category" sortConfig={sortConfig} />
                          </button>
                        </th>
                        <th className="px-6 py-3 w-[16%] text-left font-medium text-gray-700 dark:text-gray-300">
                          <button onClick={() => requestSort('account')} className="flex items-center hover:text-foreground">
                            {t('invoice_detail.col_account')} <SortIcon column="account" sortConfig={sortConfig} />
                          </button>
                        </th>
                        <th className="px-6 py-3 w-[16%] text-right font-medium text-gray-700 dark:text-gray-300">
                          <button onClick={() => requestSort('amount')} className="flex items-center justify-end w-full hover:text-foreground">
                            {t('invoice_detail.col_value')} <SortIcon column="amount" sortConfig={sortConfig} />
                          </button>
                        </th>
                        <th className="px-6 py-3 w-[16%] text-center font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                      {visiblePayments.map(p => {
                        const modalPayColor = p.amount < 0 ? DANGER : p.amount > 0 ? SUCCESS : undefined;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatDate(p.date)}</td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-50 truncate" title={p.description}>{p.description}</td>
                            <td className="px-6 py-4">
                              {p.categories ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.categories.color }} />
                                  <span className="truncate text-gray-700 dark:text-gray-300">{p.categories.name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">{t('common.no_category')}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate">{p.account?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-right font-medium whitespace-nowrap" style={{ color: modalPayColor }}>
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
              </div>
            )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('invoice_detail.divergent_title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              {t('invoice_detail.divergent_desc', {
                payment: paymentToConfirm && formatCurrency(Math.abs(paymentToConfirm.amount), paymentToConfirm.account?.currency || 'BRL'),
                total: formatCurrency(Math.abs(invoiceTotal), invoiceCurrency || 'BRL')
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-stretch">
            <AlertDialogCancel
              onClick={() => setPaymentToConfirm(null)}
              className="mt-0 flex-1 rounded-lg focus:ring-0 focus:ring-offset-0"
              style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => linkPayment(paymentToConfirm?.id)}
              className="flex-1 rounded-lg border"
              style={{ borderColor: DANGER, color: DANGER, backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
            >
              {t('invoice_detail.confirm_link')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoicePaymentLinkModal;
