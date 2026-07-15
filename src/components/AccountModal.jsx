import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import SelectInput from '@/components/ui/SelectInput';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';
import NumberInput from '@/components/ui/NumberInput';
import { FIAT_OPTIONS, CRYPTO_OPTIONS, getCurrencySymbol } from '@/utils/currencySymbolMap';
import { isCryptoCurrency } from '@/utils/calculations';
import { ACCOUNT_SUBTYPE_MAP, VALID_SUBTYPES } from '@/utils/accountMappings';
import { validateCreditCardAccount } from '@/utils/accountValidation';
import { PRIMARY, SUCCESS } from '@/utils/colors';

const AccountModal = ({ isOpen, onClose, accountToEdit, initialData }) => {
  const { t } = useTranslation();
  const { addAccount, updateAccount, createAccount } = useFinance();
  const { toast } = useToast();
  
  const initialFormState = {
    name: '',
    type: 'checking',
    account_subtype: 'checking',
    bank: '',
    initial_balance: '',
    credit_limit: '',
    color: '#3b82f6',
    icon: 'bx bx-wallet',
    currency: 'BRL',
    crypto_symbol: '',
    manual_rate: '',
    closing_date: '',
    due_date: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form fields when the modal opens or the target account/template changes (adjust state during render, per React docs).
  // The tracker starts as a unique sentinel (never `===` to any real key) so the very first
  // render also syncs when the modal is already open with a target account/template at mount time.
  const syncKey = `${isOpen}|${accountToEdit?.id ?? ''}|${initialData ? JSON.stringify(initialData) : ''}`;
  const [syncedKey, setSyncedKey] = useState(() => Symbol('unsynced'));
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    if (accountToEdit) {
      const mappedSubtype = accountToEdit.account_subtype || ACCOUNT_SUBTYPE_MAP[accountToEdit.type] || 'other';
      setFormData({
        name: accountToEdit.name,
        type: accountToEdit.type || 'checking',
        account_subtype: mappedSubtype,
        bank: accountToEdit.bank || '',
        initial_balance: accountToEdit.type === 'credit_card' ? '' : (accountToEdit.initial_balance || ''),
        credit_limit: accountToEdit.credit_limit || '',
        color: accountToEdit.color || '#3b82f6',
        icon: accountToEdit.icon || 'bx bx-wallet',
        currency: accountToEdit.currency || 'BRL',
        crypto_symbol: accountToEdit.crypto_symbol || '',
        manual_rate: accountToEdit.expected_return || '',
        closing_date: accountToEdit.closing_date || '',
        due_date: accountToEdit.due_date || ''
      });
    } else if (initialData) {
      const mappedSubtype = initialData.account_subtype || ACCOUNT_SUBTYPE_MAP[initialData.type] || 'other';
      setFormData(prev => ({
        ...prev,
        name: initialData.name || '',
        type: initialData.type || 'checking',
        account_subtype: mappedSubtype,
        bank: initialData.bank || '',
        initial_balance: initialData.type === 'credit_card' ? '' : (initialData.initial_balance || ''),
        credit_limit: initialData.credit_limit || '',
        color: initialData.color || '#3b82f6',
        icon: initialData.icon || 'bx bx-wallet',
        currency: initialData.currency || 'BRL',
        crypto_symbol: initialData.crypto_symbol || '',
        manual_rate: initialData.expected_return || '',
        closing_date: initialData.closing_date || '',
        due_date: initialData.due_date || ''
      }));
    } else {
      setFormData(initialFormState);
    }
  }

  const validateDay = (val) => {
    if (!val) return true;
    const num = parseInt(val, 10);
    return num >= 1 && num <= 31;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: t('common.required_field'), description: t('accounts.name_required_desc'), variant: "destructive" });
      return;
    }

    if (!formData.account_subtype || !VALID_SUBTYPES.includes(formData.account_subtype)) {
      toast({ title: t('common.validation_error'), description: t('accounts.subtype_invalid_desc'), variant: "destructive" });
      return;
    }

    if (!formData.currency) {
      toast({ title: t('common.required_field'), description: t('accounts.currency_required_desc'), variant: "destructive" });
      return;
    }

    if (formData.type === 'credit_card') {
      if (!validateDay(formData.closing_date) || !validateDay(formData.due_date)) {
        toast({ title: t('common.validation_error'), description: t('accounts.credit_card_days_invalid_desc'), variant: "destructive" });
        return;
      }
    }
    
    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      account_subtype: formData.account_subtype,
      bank: formData.bank || null,
      color: formData.color,
      icon: formData.icon,
      currency: formData.currency,
      crypto_symbol: formData.type === 'crypto' ? formData.currency : null,
      initial_balance: formData.type === 'credit_card' ? 0 : (formData.initial_balance ? Number(formData.initial_balance) : 0),
      balance: formData.type === 'credit_card' ? 0 : (formData.initial_balance ? Number(formData.initial_balance) : 0),
      credit_limit: formData.type === 'credit_card' && formData.credit_limit ? Number(formData.credit_limit) : null,
      expected_return: formData.type === 'crypto' && formData.manual_rate ? Number(formData.manual_rate) : null,
      closing_date: formData.type === 'credit_card' && formData.closing_date ? parseInt(formData.closing_date, 10) : null,
      due_date: formData.type === 'credit_card' && formData.due_date ? parseInt(formData.due_date, 10) : null
    };

    const validation = validateCreditCardAccount(payload);
    if (!validation.isValid) {
      toast({ title: t('common.validation_error'), description: validation.error, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (accountToEdit) {
        await updateAccount(accountToEdit.id, payload);
        toast({ title: t('accounts.updated_success') });
      } else {
        const saveFn = addAccount || createAccount;
        if (!saveFn) throw new Error(t('accounts.save_function_missing'));
        await saveFn(payload);
        toast({ title: t('accounts.created_success') });
      }
      onClose();
    } catch (error) {
      console.error("AccountModal: Erro ao salvar", error);
      toast({
        title: t('common.save_error'),
        description: error?.message || t('accounts.save_error_desc'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const mappedSubtype = ACCOUNT_SUBTYPE_MAP[newType] || 'other';

    setFormData(prev => ({
      ...prev,
      type: newType,
      account_subtype: mappedSubtype,
      currency: newType === 'crypto' ? 'BTC' : 'BRL',
      crypto_symbol: newType === 'crypto' ? 'BTC' : ''
    }));
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      currency: value,
      crypto_symbol: prev.type === 'crypto' ? value : ''
    }));
  };

  const typeOptions = [
    { label: t('accounts.type_checking'), value: "checking" },
    { label: t('accounts.type_credit_card'), value: "credit_card" },
    { label: t('accounts.type_savings'), value: "savings" },
    { label: t('accounts.type_investment'), value: "investment" },
    { label: t('accounts.type_crypto'), value: "crypto" },
    { label: t('accounts.type_cash'), value: "cash" },
    { label: t('accounts.type_meal_voucher'), value: "meal_voucher" },
    { label: t('accounts.type_food_voucher'), value: "food_voucher" },
    { label: t('accounts.type_loan'), value: "loan" },
    { label: t('accounts.type_assets'), value: "assets" },
    { label: t('accounts.type_joint_account'), value: "joint_account" },
    { label: t('accounts.type_payment_account'), value: "payment_account" },
    { label: t('accounts.type_other'), value: "other" }
  ];

  const getSymbolFallback = (currencyCode) => {
    try {
      return getCurrencySymbol(currencyCode) || currencyCode;
    } catch {
      return isCryptoCurrency(currencyCode) && currencyCode === 'BTC' ? '₿' : currencyCode;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) onClose();
    }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{accountToEdit ? t('accounts.edit_title') : t('accounts.new')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('accounts.name_label')}</Label>
            <input
              id="name"
              required
              className="h-10 w-full px-3 py-2 bg-background border rounded-lg outline-none hover:border-primary focus:border-primary mt-1 text-foreground"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SelectInput
                label={t('accounts.type_label')}
                value={formData.type}
                onChange={handleTypeChange}
                options={typeOptions}
                required
              />
            </div>
            <div>
              <SelectInput
                label={t('accounts.currency_label')}
                value={formData.currency}
                onChange={handleCurrencyChange}
                options={formData.type === 'crypto' ? CRYPTO_OPTIONS : FIAT_OPTIONS}
                required
                currencySymbol={getSymbolFallback(formData.currency)}
              />
            </div>
          </div>

          {formData.type === 'credit_card' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="closing_date">{t('accounts.opening_day_label')}</Label>
                <input
                  id="closing_date"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 1"
                  className="h-10 w-full px-3 py-2 bg-background border rounded-lg outline-none hover:border-primary focus:border-primary mt-1 no-spinner text-foreground"
                  value={formData.closing_date}
                  onChange={e => setFormData({ ...formData, closing_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="due_date">{t('accounts.closing_day_label')}</Label>
                <input
                  id="due_date"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 15"
                  className="h-10 w-full px-3 py-2 bg-background border rounded-lg outline-none hover:border-primary focus:border-primary mt-1 no-spinner text-foreground"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank">{t('accounts.institution_optional_label')}</Label>
              <input
                id="bank"
                className="h-10 w-full px-3 py-2 bg-background border rounded-lg outline-none hover:border-primary focus:border-primary mt-1 text-foreground"
                value={formData.bank}
                onChange={e => setFormData({ ...formData, bank: e.target.value })}
              />
            </div>
            {formData.type === 'credit_card' ? (
              <div>
                <Label htmlFor="credit_limit">{t('accounts.credit_limit_label')}</Label>
                <div className="pt-1">
                  <NumberInput
                    id="credit_limit"
                    value={formData.credit_limit}
                    onChange={e => setFormData({ ...formData, credit_limit: e.target.value })}
                    currencyCode={formData.currency}
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="initial_balance">{t('accounts.initial_balance')}</Label>
                <div className="pt-1">
                  <NumberInput
                    id="initial_balance"
                    value={formData.initial_balance}
                    onChange={e => setFormData({ ...formData, initial_balance: e.target.value })}
                    currencyCode={formData.currency}
                  />
                </div>
              </div>
            )}
          </div>
          
          {formData.type === 'crypto' && (
            <div>
              <Label htmlFor="manualRate">{t('accounts.crypto_rate_label')}</Label>
              <div className="text-xs text-muted-foreground mb-1">{t('accounts.crypto_rate_hint')}</div>
              <NumberInput
                id="manualRate"
                value={formData.manual_rate}
                onChange={e => setFormData({ ...formData, manual_rate: e.target.value })}
                currencyCode="BRL"
                placeholder="Ex: 350000,00"
              />
            </div>
          )}

          <ColorPicker 
            value={formData.color} 
            onChange={color => setFormData({ ...formData, color })} 
          />
          
          <IconSelector 
            selectedIcon={formData.icon} 
            onSelect={icon => setFormData({ ...formData, icon })} 
          />

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
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;