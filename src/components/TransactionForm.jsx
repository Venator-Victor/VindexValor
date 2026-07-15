import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkle as Sparkles } from '@/components/BxIcon';
import SelectInput from '@/components/ui/SelectInput';
import DatePicker from '@/components/ui/DatePicker';
import NumberInput from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/checkbox';
import { useAutoMappingCategories } from '@/hooks/useAutoMappingCategories';
import { formatCurrencyWithSymbol } from '@/utils/calculations';
import { PERIOD_OPTIONS } from '@/utils/periodOptions';
import { buildFlatIndentedOptions } from '@/utils/categoryTree';
import { SUCCESS, PRIMARY, INFO, infoAlpha } from '@/utils/colors';

const TransactionForm = ({ initialData, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { accounts, categories, invoices, createTransaction, updateTransaction } = useFinance();
  const { saveCategoryMapping, getSuggestedCategory } = useAutoMappingCategories();
  const { toast } = useToast();
  const categoryOptions = useMemo(() => buildFlatIndentedOptions(categories), [categories]);

  const [isAutoMapped, setIsAutoMapped] = useState(false);
  const debounceRef = useRef(null);

  const [formData, setFormData] = useState({
    type: 'expense',
    is_recurring: false,
    recurring_type: 'subscription',
    frequency: 'monthly',
    recurring_installment_count: '',
    amount: '',
    converted_amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    category_id: '',
    account_id: '',
    destination_account_id: '',
    invoice_id: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form fields when `initialData` changes (adjust state during render, per React docs).
  // The tracker starts as a unique sentinel (never `===` to any real prop) so the very first
  // render also syncs when `initialData` is already provided at mount time.
  const [syncedInitialData, setSyncedInitialData] = useState(() => ({}));
  if (initialData && initialData !== syncedInitialData) {
    setSyncedInitialData(initialData);
    setFormData({
      type: initialData.type || 'expense',
      is_recurring: initialData.is_recurring || false,
      recurring_type: initialData.recurring_type || 'subscription',
      frequency: 'monthly',
      recurring_installment_count: '',
      amount: Math.abs(initialData.amount) || '',
      converted_amount: initialData.converted_amount || '',
      description: initialData.description || '',
      date: initialData.date || new Date().toISOString().slice(0, 10),
      category_id: initialData.category_id || '',
      account_id: initialData.account_id || '',
      destination_account_id: initialData.destination_account_id || '',
      invoice_id: initialData.invoice_id || ''
    });
    setIsAutoMapped(false);
  }

  const sourceAccount = useMemo(() => accounts.find(a => a.id === formData.account_id), [accounts, formData.account_id]);
  const destAccount = useMemo(() => accounts.find(a => a.id === formData.destination_account_id), [accounts, formData.destination_account_id]);

  const isCrossCurrencyTransfer = formData.type === 'transfer' &&
                                  sourceAccount &&
                                  destAccount &&
                                  sourceAccount.currency !== destAccount.currency;

  const handleDescriptionChange = (e) => {
    const newDesc = e.target.value;
    setFormData(prev => ({ ...prev, description: newDesc }));

    if (formData.type !== 'transfer' && formData.type !== 'payment' && (!initialData || !initialData.category_id)) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (newDesc.trim().length > 2) {
          const suggestedId = getSuggestedCategory(newDesc);
          if (suggestedId) {
            setFormData(prev => ({ ...prev, category_id: suggestedId }));
            setIsAutoMapped(true);
          }
        }
      }, 500);
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, category_id: value });
    setIsAutoMapped(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.type !== 'payment' && formData.invoice_id) {
        toast({ title: t('common.validation_error'), description: t('transactions.invoice_payment_only_error'), variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const original_amount = Math.abs(Number(formData.amount));
      let finalAmount = (formData.type === 'expense' || formData.type === 'transfer' || formData.type === 'payment') ? -original_amount : original_amount;

      let converted_amount = null;
      let exchange_rate = null;

      if (isCrossCurrencyTransfer && formData.converted_amount) {
        converted_amount = Math.abs(Number(formData.converted_amount));
        if (converted_amount > 0 && original_amount > 0) {
          exchange_rate = original_amount / converted_amount;
        }
      }

      const payload = {
        ...formData,
        amount: finalAmount,
        original_amount,
        converted_amount,
        exchange_rate,
        invoice_id: formData.type === 'payment' ? (formData.invoice_id || null) : null,
        category_id: (formData.type === 'transfer' || formData.type === 'payment') ? null : (formData.category_id || null),
        destination_account_id: formData.destination_account_id || null,
      };

      if (initialData) {
        await updateTransaction(initialData.id, payload);
      } else {
        await createTransaction(payload);
      }

      if (formData.description && formData.category_id && formData.type !== 'transfer' && formData.type !== 'payment' && !isAutoMapped) {
        await saveCategoryMapping(formData.description, formData.category_id);
      }
      onSuccess?.();
    } catch (error) {
      toast({ title: t('common.save_error'), description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 mt-1 hover:border-primary focus:border-primary outline-none";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SelectInput
              id="type"
              label={t('transactions.form_type_label')}
              value={formData.type}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                type: e.target.value,
                is_recurring: (e.target.value === 'transfer' || e.target.value === 'payment') ? false : prev.is_recurring,
                category_id: (e.target.value === 'transfer' || e.target.value === 'payment') ? '' : prev.category_id,
                // Mirrors the DB's chk_income_recurring/chk_expense_recurring constraints —
                // a recurring income transaction can only ever be 'salary', never
                // 'subscription'/'installments', and vice versa.
                recurring_type: e.target.value === 'income' ? 'salary' : (prev.recurring_type === 'salary' ? 'subscription' : prev.recurring_type)
              }))}
              options={[
                { label: t('transactions.type_expense'), value: "expense" },
                { label: t('transactions.type_income'), value: "income" },
                { label: t('transactions.type_transfer'), value: "transfer" },
                { label: t('transactions.form_type_payment_invoice'), value: "payment" }
              ]}
            />
          </div>
          <div>
            <DatePicker
              label={`${t('common.date')} *`}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">{t('transactions.form_description_label')}</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder={t('transactions.form_description_placeholder')}
            className={inputClasses}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={formData.type === 'transfer' || formData.type === 'payment' ? '' : 'md:col-span-2'}>
            <SelectInput
              id="account_id"
              label={formData.type === 'transfer' ? t('transactions.form_account_source_label') :
               formData.type === 'payment' ? t('transactions.form_account_payment_label') : t('transactions.form_account_label')}
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              searchable
              options={[
                { label: t('common.select_placeholder'), value: '' },
                ...accounts.map(acc => ({ label: `${acc.name} (${formatCurrencyWithSymbol(acc.balance, acc.currency)})`, value: acc.id }))
              ]}
            />
            {sourceAccount && (
              <div className="text-xs text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                {t('transactions.form_account_balance')} <span className="font-medium text-foreground">{formatCurrencyWithSymbol(sourceAccount.balance, sourceAccount.currency)}</span>
              </div>
            )}
          </div>

          {formData.type === 'transfer' && (
            <div>
              <SelectInput
                id="destination_account_id"
                label={t('transactions.form_account_destination_label')}
                value={formData.destination_account_id}
                onChange={(e) => setFormData({ ...formData, destination_account_id: e.target.value })}
                searchable
                options={[
                  { label: t('common.select_placeholder'), value: '' },
                  ...accounts.map(acc => ({ label: `${acc.name} (${formatCurrencyWithSymbol(acc.balance, acc.currency)})`, value: acc.id }))
                ]}
              />
              {destAccount && (
                <div className="text-xs text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                  {t('transactions.form_account_balance')} <span className="font-medium text-foreground">{formatCurrencyWithSymbol(destAccount.balance, destAccount.currency)}</span>
                </div>
              )}
            </div>
          )}

          {formData.type === 'payment' && (
            <div>
              <SelectInput
                id="invoice_id"
                label={t('transactions.form_invoice_to_pay_label')}
                value={formData.invoice_id}
                onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                options={[
                  { label: t('transactions.form_invoice_select_placeholder'), value: '' },
                  ...invoices.map(fat => ({
                    label: `${fat.invoice_number || t('transactions.form_invoice_no_number')} - ${formatCurrencyWithSymbol(fat.total_amount, 'BRL')}`,
                    value: fat.id
                  }))
                ]}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={isCrossCurrencyTransfer ? '' : 'md:col-span-2'}>
            <Label htmlFor="amount">{t('transactions.form_amount_label')} {sourceAccount ? t('transactions.form_amount_in_currency', { currency: sourceAccount.currency }) : ''} *</Label>
            <div className="pt-1">
              <NumberInput
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                currencyCode={sourceAccount?.currency || 'BRL'}
                required
              />
            </div>
          </div>

          {isCrossCurrencyTransfer && (
            <div>
              <Label htmlFor="converted_amount">{t('transactions.form_converted_amount_label')}</Label>
              <div className="pt-1">
                <NumberInput
                  id="converted_amount"
                  value={formData.converted_amount}
                  onChange={(e) => setFormData({ ...formData, converted_amount: e.target.value })}
                  currencyCode={destAccount?.currency || 'BRL'}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('transactions.form_converted_amount_hint')}</p>
            </div>
          )}
        </div>

        {formData.type !== 'transfer' && formData.type !== 'payment' && (
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="category_id" className="mb-0">{t('common.category')}</Label>
              {isAutoMapped && formData.category_id && (
                <Badge variant="secondary" className="h-5 text-[10px] gap-1 border-none" style={{ backgroundColor: infoAlpha(0.1), color: INFO }}>
                  <Sparkles className="w-3 h-3" /> {t('transactions.form_suggested_badge')}
                </Badge>
              )}
            </div>
            <SelectInput
              id="category_id"
              value={formData.category_id}
              onChange={handleCategoryChange}
              searchable
              options={[{ label: t('common.no_category'), value: '' }, ...categoryOptions]}
            />
          </div>
        )}

        {formData.type !== 'transfer' && formData.type !== 'payment' && !initialData && (
          <div className="border border-gray-200 dark:border-vindex-border rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked === true }))}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('transactions.form_recurring_toggle')}</span>
            </label>
            {formData.is_recurring && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className={formData.type === 'income' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-2 gap-3'}>
                  <SelectInput
                    label={t('common.frequency')}
                    id="frequency"
                    value={formData.frequency}
                    options={PERIOD_OPTIONS}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  />
                  {formData.type !== 'income' && (
                    <SelectInput
                      label={t('common.type')}
                      id="recurring_type"
                      value={formData.recurring_type}
                      options={[
                        { label: t('transactions.form_recurring_subscription'), value: 'subscription' },
                        { label: t('transactions.form_recurring_installments'), value: 'installments' }
                      ]}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_type: e.target.value }))}
                    />
                  )}
                </div>
                {formData.recurring_type === 'installments' && (
                  <div>
                    <Label htmlFor="recurring_installment_count">{t('transactions.form_installment_count_label')}</Label>
                    <input
                      id="recurring_installment_count"
                      type="number"
                      min={2}
                      value={formData.recurring_installment_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_installment_count: e.target.value }))}
                      placeholder="Ex: 12"
                      className={`${inputClasses} h-10 no-spinner`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
            {isSubmitting ? t('common.saving') : (initialData ? t('common.update') : t('common.create'))}
          </Button>
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
        </div>
      </form>
    </>
  );
};

export default TransactionForm;
