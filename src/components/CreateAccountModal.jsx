import React, { useState } from 'react';
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
import { ACCOUNT_SUBTYPE_MAP, VALID_SUBTYPES } from '@/utils/accountMappings';
import { validateCreditCardAccount } from '@/utils/accountValidation';

const CreateAccountModal = ({ open, onOpenChange, onAccountCreated }) => {
  const { accounts, createAccount, addAccount } = useFinance();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFormState = {
    name: '',
    type: 'Conta Corrente',
    account_subtype: 'checking',
    bank: '',
    initial_balance: '0',
    credit_limit: '',
    color: '#3B82F6',
    icon: 'bx-wallet',
    currency: 'BRL',
    crypto_symbol: '',
    manual_rate: '',
    closing_date: '',
    due_date: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const accountTypes = [
    { label: "Conta Corrente (checking)", value: "Conta Corrente" },
    { label: "Cartão de Crédito (credit_card)", value: "Cartão de Crédito" },
    { label: "Poupança (savings)", value: "Poupança" },
    { label: "Investimento (investment)", value: "Investimento" },
    { label: "Criptomoeda (crypto)", value: "Criptomoeda" },
    { label: "Dinheiro (cash)", value: "Dinheiro" },
    { label: "Outros (other)", value: "Outros" }
  ];

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const mappedSubtype = ACCOUNT_SUBTYPE_MAP[newType] || 'other';
    
    setFormData(prev => ({
      ...prev,
      type: newType,
      account_subtype: mappedSubtype,
      currency: newType === 'Criptomoeda' ? 'BTC' : 'BRL',
      crypto_symbol: newType === 'Criptomoeda' ? 'BTC' : '',
      initial_balance: newType === 'Cartão de Crédito' ? '0' : prev.initial_balance
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
    
    if (!formData.type) {
      toast({ title: "Campo obrigatório", description: "O tipo de conta é obrigatório.", variant: "destructive" });
      return;
    }

    if (!formData.account_subtype || !VALID_SUBTYPES.includes(formData.account_subtype)) {
      toast({ title: "Erro de Validação", description: "O subtipo de conta é inválido ou está ausente. Selecione um tipo válido.", variant: "destructive" });
      return;
    }

    if (!formData.currency) {
      toast({ title: "Campo obrigatório", description: "A moeda é obrigatória.", variant: "destructive" });
      return;
    }

    let initBal = 0;
    let limit = null;

    if (formData.type === 'Cartão de Crédito') {
      limit = parseFloat(formData.credit_limit);
      if (isNaN(limit) || limit <= 0) {
        toast({ title: "Erro de Validação", description: "Limite do cartão inválido.", variant: "destructive" });
        return;
      }
      if (!formData.closing_date || !formData.due_date || !validateDay(formData.closing_date) || !validateDay(formData.due_date)) {
        toast({ title: "Erro de Validação", description: "Os dias de abertura e fechamento devem estar entre 1 e 31.", variant: "destructive" });
        return;
      }
    } else {
      initBal = parseFloat(formData.initial_balance);
      if (isNaN(initBal)) {
        toast({ title: "Erro de Validação", description: "Saldo inicial inválido.", variant: "destructive" });
        return;
      }
    }
    
    const isDuplicate = accounts.some(acc => acc.name.toLowerCase() === formData.name.trim().toLowerCase());
    if (isDuplicate) {
      toast({ title: "Erro de Validação", description: "Já existe uma conta com este nome.", variant: "destructive" });
      return;
    }

    const dataToSubmit = {
      name: formData.name.trim(),
      type: formData.type,
      account_subtype: formData.account_subtype,
      bank: formData.bank || null,
      color: formData.color,
      icon: formData.icon,
      currency: formData.currency,
      crypto_symbol: formData.type === 'Criptomoeda' ? formData.currency : null,
      initial_balance: formData.type === 'Cartão de Crédito' ? 0 : initBal,
      balance: formData.type === 'Cartão de Crédito' ? 0 : initBal,
      credit_limit: formData.type === 'Cartão de Crédito' ? limit : null,
      expected_return: formData.type === 'Criptomoeda' && formData.manual_rate ? Number(formData.manual_rate) : null,
      closing_date: formData.type === 'Cartão de Crédito' && formData.closing_date ? parseInt(formData.closing_date, 10) : null,
      due_date: formData.type === 'Cartão de Crédito' && formData.due_date ? parseInt(formData.due_date, 10) : null
    };

    const validation = validateCreditCardAccount(dataToSubmit);
    if (!validation.isValid) {
      toast({ title: "Erro de Validação", description: validation.error, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const saveFn = createAccount || addAccount;
      if (!saveFn) throw new Error("Função de salvamento não encontrada no contexto");

      const newAccount = await saveFn(dataToSubmit);
      
      if (!newAccount) {
        throw new Error("Resposta vazia do servidor.");
      }

      toast({ title: "Conta criada com sucesso!", description: `A conta ${newAccount.name} foi adicionada.` });
      
      if (typeof onAccountCreated === 'function') {
        onAccountCreated(newAccount.id);
      }
      onOpenChange(false);
      setFormData(initialFormState);
      
    } catch (error) {
      console.error("CreateAccountModal: Erro ao submeter formulário:", error);
      toast({ 
        title: "Erro ao salvar conta", 
        description: error?.message || "Ocorreu um erro interno no servidor. Tente novamente.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isSubmitting) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="accountName">Nome da Conta *</Label>
            <input
              id="accountName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-lg bg-background border-input outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="Ex: Nubank, Itaú..."
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SelectInput
                id="accountType"
                label="Tipo de Conta *"
                value={formData.type}
                onChange={handleTypeChange}
                options={accountTypes}
                required
              />
            </div>

            <div>
              <SelectInput
                id="accountCurrency"
                label="Moeda *"
                value={formData.currency}
                onChange={handleCurrencyChange}
                options={formData.type === 'Criptomoeda' ? CRYPTO_OPTIONS : FIAT_OPTIONS}
                required
                currencySymbol={getCurrencySymbol(formData.currency)}
              />
            </div>
          </div>

          {formData.type === 'Cartão de Crédito' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="closing_date_create">Dia de Abertura *</Label>
                <input
                  id="closing_date_create"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 1"
                  className="w-full px-3 py-2 mt-1 border rounded-lg bg-background border-input outline-none focus:ring-2 focus:ring-primary/50 text-foreground no-spinner"
                  value={formData.closing_date}
                  onChange={e => setFormData({ ...formData, closing_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="due_date_create">Dia de Fechamento *</Label>
                <input
                  id="due_date_create"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 15"
                  className="w-full px-3 py-2 mt-1 border rounded-lg bg-background border-input outline-none focus:ring-2 focus:ring-primary/50 text-foreground no-spinner"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="accountBank">Banco / Instituição (Opcional)</Label>
            <input
              id="accountBank"
              type="text"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-lg bg-background border-input outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="Ex: Nubank, Inter..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formData.type === 'Cartão de Crédito' ? (
              <div>
                <Label htmlFor="accountCreditLimit">Limite do Cartão *</Label>
                <div className="relative mt-1">
                  <NumberInput
                    id="accountCreditLimit"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    className="w-full"
                    placeholder="0,00"
                    currencyCode={formData.currency}
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="accountInitialBalance">Saldo Inicial *</Label>
                <div className="relative mt-1">
                  <NumberInput
                    id="accountInitialBalance"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                    className="w-full"
                    placeholder="0,00"
                    currencyCode={formData.currency}
                    required
                  />
                </div>
              </div>
            )}

            {formData.type === 'Criptomoeda' && (
              <div>
                <Label htmlFor="manualRateCreate">Cotação (BRL)</Label>
                <div className="relative mt-1">
                  <NumberInput
                    id="manualRateCreate"
                    value={formData.manual_rate}
                    onChange={(e) => setFormData({ ...formData, manual_rate: e.target.value })}
                    className="w-full"
                    placeholder="Ex: 350000,00"
                    currencyCode="BRL"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <Label className="block mb-1">Cor da Conta</Label>
              <ColorPicker 
                value={formData.color} 
                onChange={(color) => setFormData({ ...formData, color })} 
              />
            </div>
            <div>
              <Label className="block mb-1">Ícone</Label>
              <IconSelector 
                selectedIcon={formData.icon} 
                onSelect={(icon) => setFormData({ ...formData, icon })} 
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccountModal;