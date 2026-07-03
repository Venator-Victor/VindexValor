import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

const AccountModal = ({ isOpen, onClose, accountToEdit, initialData }) => {
  const { addAccount, updateAccount, createAccount } = useFinance();
  const { toast } = useToast();
  
  const initialFormState = {
    name: '',
    type: 'Conta Corrente',
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
        type: accountToEdit.type || 'Conta Corrente',
        account_subtype: mappedSubtype,
        bank: accountToEdit.bank || '',
        initial_balance: accountToEdit.type === 'Cartão de Crédito' ? '' : (accountToEdit.initial_balance || ''),
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
        type: initialData.type || 'Conta Corrente',
        account_subtype: mappedSubtype,
        bank: initialData.bank || '',
        initial_balance: initialData.type === 'Cartão de Crédito' ? '' : (initialData.initial_balance || ''),
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
      toast({ title: "Campo obrigatório", description: "O nome da conta é obrigatório.", variant: "destructive" });
      return;
    }

    if (!formData.account_subtype || !VALID_SUBTYPES.includes(formData.account_subtype)) {
      toast({ title: "Erro de Validação", description: "O subtipo de conta é inválido ou está ausente.", variant: "destructive" });
      return;
    }

    if (!formData.currency) {
      toast({ title: "Campo obrigatório", description: "A moeda é obrigatória.", variant: "destructive" });
      return;
    }

    if (formData.type === 'Cartão de Crédito') {
      if (!validateDay(formData.closing_date) || !validateDay(formData.due_date)) {
        toast({ title: "Erro de Validação", description: "Os dias de abertura e fechamento devem estar entre 1 e 31.", variant: "destructive" });
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
      crypto_symbol: formData.type === 'Criptomoeda' ? formData.currency : null,
      initial_balance: formData.type === 'Cartão de Crédito' ? 0 : (formData.initial_balance ? Number(formData.initial_balance) : 0),
      balance: formData.type === 'Cartão de Crédito' ? 0 : (formData.initial_balance ? Number(formData.initial_balance) : 0),
      credit_limit: formData.type === 'Cartão de Crédito' && formData.credit_limit ? Number(formData.credit_limit) : null,
      expected_return: formData.type === 'Criptomoeda' && formData.manual_rate ? Number(formData.manual_rate) : null,
      closing_date: formData.type === 'Cartão de Crédito' && formData.closing_date ? parseInt(formData.closing_date, 10) : null,
      due_date: formData.type === 'Cartão de Crédito' && formData.due_date ? parseInt(formData.due_date, 10) : null
    };

    const validation = validateCreditCardAccount(payload);
    if (!validation.isValid) {
      toast({ title: "Erro de Validação", description: validation.error, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (accountToEdit) {
        await updateAccount(accountToEdit.id, payload);
        toast({ title: "Conta atualizada com sucesso!" });
      } else {
        const saveFn = addAccount || createAccount;
        if (!saveFn) throw new Error("Função de salvamento não encontrada");
        await saveFn(payload);
        toast({ title: "Conta criada com sucesso!" });
      }
      onClose();
    } catch (error) {
      console.error("AccountModal: Erro ao salvar", error);
      toast({ 
        title: "Erro ao salvar conta", 
        description: error?.message || "Erro desconhecido. Verifique o console.", 
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
      currency: newType === 'Criptomoeda' ? 'BTC' : 'BRL',
      crypto_symbol: newType === 'Criptomoeda' ? 'BTC' : ''
    }));
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      currency: value,
      crypto_symbol: prev.type === 'Criptomoeda' ? value : ''
    }));
  };

  const typeOptions = [
    { label: "Conta Corrente", value: "Conta Corrente" },
    { label: "Cartão de Crédito", value: "Cartão de Crédito" },
    { label: "Poupança", value: "Poupança" },
    { label: "Investimentos", value: "Investimentos" },
    { label: "Criptomoeda", value: "Criptomoeda" },
    { label: "Dinheiro", value: "Dinheiro" },
    { label: "Outros", value: "Outros" }
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
          <DialogTitle>{accountToEdit ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Conta *</Label>
            <input
              id="name"
              required
              className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1 text-foreground"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SelectInput
                label="Tipo de Conta *"
                value={formData.type}
                onChange={handleTypeChange}
                options={typeOptions}
                required
              />
            </div>
            <div>
              <SelectInput
                label="Moeda *"
                value={formData.currency}
                onChange={handleCurrencyChange}
                options={formData.type === 'Criptomoeda' ? CRYPTO_OPTIONS : FIAT_OPTIONS}
                required
                currencySymbol={getSymbolFallback(formData.currency)}
              />
            </div>
          </div>

          {formData.type === 'Cartão de Crédito' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="closing_date">Dia de Abertura</Label>
                <input
                  id="closing_date"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 1"
                  className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1 no-spinner text-foreground"
                  value={formData.closing_date}
                  onChange={e => setFormData({ ...formData, closing_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Dia de Fechamento</Label>
                <input
                  id="due_date"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 15"
                  className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1 no-spinner text-foreground"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank">Instituição (Opcional)</Label>
              <input
                id="bank"
                className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1 text-foreground"
                value={formData.bank}
                onChange={e => setFormData({ ...formData, bank: e.target.value })}
              />
            </div>
            {formData.type === 'Cartão de Crédito' ? (
              <div>
                <Label htmlFor="credit_limit">Limite do Cartão *</Label>
                <div className="mt-1">
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
                <Label htmlFor="initial_balance">Saldo Inicial</Label>
                <div className="mt-1">
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
          
          {formData.type === 'Criptomoeda' && (
            <div>
              <Label htmlFor="manualRate">Cotação Atualizada (em BRL)</Label>
              <div className="text-xs text-muted-foreground mb-1">Usada para calcular o valor patrimonial</div>
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

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;