import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/ui/DatePicker';
import SelectInput from '@/components/ui/SelectInput';
import NumberInput from '@/components/ui/NumberInput';
import { ArrowDownRight, ArrowUpRight } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { buildFlatIndentedOptions } from '@/utils/categoryTree';
import { formatCurrencyWithSymbol } from '@/utils/calculations';
import { SUCCESS, PRIMARY } from '@/utils/colors';

const InvoiceItemForm = ({ invoiceId, initialData, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { categories, accounts, transactions, createInvoiceItem, updateInvoiceItem } = useFinance();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState('expense');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    account_id: '',
    transaction_id: '',
    amount: '',
    is_payment: false,
    is_carryover: false
  });

  // Sync form fields when `initialData` changes (adjust state during render, per React docs).
  // The tracker starts as a unique sentinel (never `===` to any real prop) so the very first
  // render also syncs when `initialData` is already provided at mount time.
  const [syncedInitialData, setSyncedInitialData] = useState(() => ({}));
  if (initialData && initialData !== syncedInitialData) {
    setSyncedInitialData(initialData);
    const initialType = Number(initialData.amount) >= 0 ? 'income' : 'expense';
    setType(initialType);
    setFormData({
      date: initialData.date || new Date().toISOString().split('T')[0],
      description: initialData.description || '',
      category_id: initialData.category_id || '',
      account_id: initialData.account_id || '',
      transaction_id: initialData.transaction_id || '',
      amount: Math.abs(Number(initialData.amount || 0)),
      is_payment: initialData.is_payment || false,
      is_carryover: initialData.is_carryover || false
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.description || !formData.amount) {
      toast({ title: t('common.error'), description: t('invoice_detail.item_form_required_error'), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const numericValue = Number(formData.amount);
      const finalValor = type === 'expense' ? -Math.abs(numericValue) : Math.abs(numericValue);

      const payload = {
        invoice_id: invoiceId,
        date: formData.date,
        description: formData.description,
        category_id: formData.category_id || null,
        account_id: formData.account_id || null,
        transaction_id: formData.transaction_id || null,
        amount: finalValor,
        is_payment: type === 'income' && formData.is_payment,
        is_carryover: type === 'expense' && formData.is_carryover
      };

      if (initialData) {
        await updateInvoiceItem(initialData.id, payload);
        toast({ title: t('invoice_detail.item_form_updated_success') });
      } else {
        await createInvoiceItem(payload);

        // Auto-update fatura closing_date to the first day of the next month
        const dataObj = new Date(formData.date);
        const nextMonth = new Date(dataObj.getUTCFullYear(), dataObj.getUTCMonth() + 1, 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];

        await supabase
          .from('invoices')
          .update({ closing_date: nextMonthStr })
          .eq('id', invoiceId);

        toast({ title: t('invoice_detail.item_form_created_success') });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({ title: t('common.error'), description: error.message || t('invoice_detail.item_form_save_error'), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const eligibleTransactions = transactions.filter(tx => tx.date.startsWith(formData.date.substring(0, 7)));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{t('invoice_detail.item_form_type_label')}</Label>
        <div className="bg-gray-50 dark:bg-vindex-bg/50 p-1 rounded-lg flex mt-2 border border-gray-200 dark:border-vindex-border">
          <button
            type="button"
            onClick={() => { setType('expense'); setFormData(prev => ({ ...prev, is_payment: false })); }}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              type === 'expense'
                ? 'bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 mr-2 shrink-0" />
            {t('invoice_detail.item_form_type_expense')}
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setFormData(prev => ({ ...prev, is_carryover: false })); }}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              type === 'income'
                ? 'bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 mr-2 shrink-0" />
            {t('invoice_detail.item_form_type_income')}
          </button>
        </div>
        {type === 'income' && (
          <label className="flex items-center gap-2 cursor-pointer select-none mt-3">
            <Checkbox
              checked={formData.is_payment}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_payment: checked === true }))}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.item_form_is_payment_label')}</span>
          </label>
        )}
        {type === 'expense' && (
          <label className="flex items-center gap-2 cursor-pointer select-none mt-3">
            <Checkbox
              checked={formData.is_carryover}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_carryover: checked === true }))}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.item_form_is_carryover_label')}</span>
          </label>
        )}
      </div>

      <div>
        <DatePicker
          label={t('invoice_detail.item_form_date_label')}
          value={formData.date}
          onChange={(e) => {
            const newDate = e.target.value;
            // Clear the linked transaction if it no longer falls in the new month,
            // instead of silently keeping a reference that's no longer shown as selected.
            const stillEligible = formData.transaction_id &&
              transactions.some(tx => tx.id === formData.transaction_id && tx.date.startsWith(newDate.substring(0, 7)));
            setFormData(prev => ({
              ...prev,
              date: newDate,
              transaction_id: stillEligible ? prev.transaction_id : ''
            }));
          }}
        />
      </div>

      <div>
        <Label htmlFor="description">{t('invoice_detail.item_form_description_label')}</Label>
        <input
          id="description"
          className="h-10 w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 hover:border-primary focus:border-primary outline-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('invoice_detail.item_form_description_placeholder')}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label={t('common.category')}
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          options={[
            { label: t('common.select_placeholder'), value: "" },
            ...buildFlatIndentedOptions(categories)
          ]}
        />
        <SelectInput
          label={t('common.account')}
          value={formData.account_id}
          onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
          options={[
            { label: t('common.select_placeholder'), value: "" },
            ...accounts.map(a => ({ label: a.name, value: a.id }))
          ]}
        />
      </div>

      <div>
        <SelectInput
          label={t('invoice_detail.item_form_link_transaction_label')}
          value={formData.transaction_id}
          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
          options={[
            { label: t('invoice_detail.item_form_no_transaction_linked'), value: "" },
            ...eligibleTransactions.map(tx => ({ label: `${tx.description} - ${formatCurrencyWithSymbol(Math.abs(tx.amount), tx.account?.currency || 'BRL')}`, value: tx.id }))
          ]}
        />
      </div>

      <div>
        <Label htmlFor="amount">{t('invoice_detail.item_form_amount_label')}</Label>
        <div className="pt-1">
          <NumberInput
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            currencyCode="BRL"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          variant="outline"
          disabled={isSubmitting}
          className="flex-1 font-medium rounded-lg transition-colors bg-transparent"
          style={{ borderColor: SUCCESS, color: SUCCESS }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
        >
          {isSubmitting ? t('common.saving') : t('invoice_detail.item_form_save')}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border transition-colors bg-transparent"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
          >
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};

export default InvoiceItemForm;