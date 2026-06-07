import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import SelectInput from '@/components/ui/SelectInput';
import DatePicker from '@/components/ui/DatePicker';
import NumberInput from '@/components/ui/NumberInput';
import { useAutoMappingCategories } from '@/hooks/useAutoMappingCategories';
import { formatCurrencyWithSymbol } from '@/utils/calculations';
import { PERIOD_OPTIONS } from '@/utils/periodOptions';

const TransactionForm = ({ initialData, onSuccess, onCancel }) => {
  const { accounts, categories, faturas, createTransaction, updateTransaction } = useFinance();
  const { saveCategoryMapping, getSuggestedCategory } = useAutoMappingCategories();
  const { toast } = useToast();

  const [isAutoMapped, setIsAutoMapped] = useState(false);
  const debounceRef = useRef(null);

  const [formData, setFormData] = useState({
    type: 'saida',
    is_recurring: false,
    recurring_type: 'Assinatura',
    frequency: 'Mensal',
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

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'saida',
        is_recurring: initialData.is_recurring || false,
        recurring_type: initialData.recurring_type || 'Assinatura',
        frequency: 'Mensal',
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
  }, [initialData]);

  const sourceAccount = useMemo(() => accounts.find(a => a.id === formData.account_id), [accounts, formData.account_id]);
  const destAccount = useMemo(() => accounts.find(a => a.id === formData.destination_account_id), [accounts, formData.destination_account_id]);

  const isCrossCurrencyTransfer = formData.type === 'transferencia' &&
                                  sourceAccount &&
                                  destAccount &&
                                  sourceAccount.currency !== destAccount.currency;

  const handleDescriptionChange = (e) => {
    const newDesc = e.target.value;
    setFormData(prev => ({ ...prev, description: newDesc }));

    if (formData.type !== 'transferencia' && formData.type !== 'pagamento' && (!initialData || !initialData.category_id)) {
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
      if (formData.type !== 'pagamento' && formData.invoice_id) {
        toast({ title: "Erro de Validação", description: "Apenas pagamentos podem ter faturas vinculadas.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const original_amount = Math.abs(Number(formData.amount));
      let finalAmount = (formData.type === 'saida' || formData.type === 'transferencia' || formData.type === 'pagamento') ? -original_amount : original_amount;

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
        invoice_id: formData.type === 'pagamento' ? (formData.invoice_id || null) : null,
        category_id: (formData.type === 'transferencia' || formData.type === 'pagamento') ? null : formData.category_id
      };

      if (initialData) {
        await updateTransaction(initialData.id, payload);
      } else {
        await createTransaction(payload);
      }

      if (formData.description && formData.category_id && formData.type !== 'transferencia' && formData.type !== 'pagamento' && !isAutoMapped) {
        await saveCategoryMapping(formData.description, formData.category_id);
      }
      onSuccess?.();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 mt-1 focus:ring-2 focus:ring-vindex-success/50 outline-none";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SelectInput
              id="type"
              label="Tipo de Transação"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                type: e.target.value,
                is_recurring: (e.target.value === 'transferencia' || e.target.value === 'pagamento') ? false : prev.is_recurring,
                category_id: (e.target.value === 'transferencia' || e.target.value === 'pagamento') ? '' : prev.category_id
              }))}
              options={[
                { label: "Saída", value: "saida" },
                { label: "Entrada", value: "entrada" },
                { label: "Transferência", value: "transferencia" },
                { label: "Pagamento de Fatura", value: "pagamento" }
              ]}
            />
          </div>
          <div>
            <DatePicker
              label="Data *"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Ex: Compra, Recebimento, Transferência..."
            className={inputClasses}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="account_id">
              {formData.type === 'transferencia' ? 'Conta Origem *' :
               formData.type === 'pagamento' ? 'Conta de Pagamento *' : 'Conta *'}
            </Label>
            <select
              id="account_id"
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className={inputClasses}
              required
            >
              <option value="">Selecione...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrencyWithSymbol(acc.balance, acc.currency)})</option>
              ))}
            </select>
            {sourceAccount && (
              <div className="text-xs text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                Saldo na conta: <span className="font-medium text-foreground">{formatCurrencyWithSymbol(sourceAccount.balance, sourceAccount.currency)}</span>
              </div>
            )}
          </div>

          {formData.type === 'transferencia' && (
            <div>
              <Label htmlFor="destination_account_id">Conta Destino *</Label>
              <select
                id="destination_account_id"
                value={formData.destination_account_id}
                onChange={(e) => setFormData({ ...formData, destination_account_id: e.target.value })}
                className={inputClasses}
                required
              >
                <option value="">Selecione...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrencyWithSymbol(acc.balance, acc.currency)})</option>
                ))}
              </select>
              {destAccount && (
                <div className="text-xs text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                  Saldo na conta: <span className="font-medium text-foreground">{formatCurrencyWithSymbol(destAccount.balance, destAccount.currency)}</span>
                </div>
              )}
            </div>
          )}

          {formData.type === 'pagamento' && (
            <div>
              <Label htmlFor="invoice_id">Fatura a Pagar *</Label>
              <select
                id="invoice_id"
                value={formData.invoice_id}
                onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                className={inputClasses}
                required
              >
                <option value="">Selecione uma fatura...</option>
                {faturas.map(fat => (
                  <option key={fat.id} value={fat.id}>
                    {fat.invoice_number || 'Sem número'} - {formatCurrencyWithSymbol(fat.total_amount, 'BRL')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Valor {sourceAccount ? `em ${sourceAccount.currency}` : ''} *</Label>
            <div className="relative mt-1">
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
              <Label htmlFor="converted_amount">Valor na moeda de destino *</Label>
              <div className="relative mt-1">
                <NumberInput
                  id="converted_amount"
                  value={formData.converted_amount}
                  onChange={(e) => setFormData({ ...formData, converted_amount: e.target.value })}
                  currencyCode={destAccount?.currency || 'BRL'}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Insira o valor recebido após a conversão, sem aproximações automáticas.</p>
            </div>
          )}
        </div>

        {formData.type !== 'transferencia' && formData.type !== 'pagamento' && (
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="category_id" className="mb-0">Categoria</Label>
              {isAutoMapped && formData.category_id && (
                <Badge variant="secondary" className="h-5 text-[10px] gap-1 bg-blue-50 text-blue-600 border-none">
                  <Sparkles className="w-3 h-3" /> Sugerido
                </Badge>
              )}
            </div>
            <select
              id="category_id"
              value={formData.category_id}
              onChange={handleCategoryChange}
              className={`${inputClasses} mt-0`}
            >
              <option value="">Sem categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {formData.type !== 'transferencia' && formData.type !== 'pagamento' && !initialData && (
          <div className="border border-gray-200 dark:border-vindex-border rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                className="w-4 h-4 accent-green-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Repetir automaticamente</span>
            </label>
            {formData.is_recurring && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <SelectInput
                    label="Frequência"
                    id="frequency"
                    value={formData.frequency}
                    options={PERIOD_OPTIONS}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  />
                  <SelectInput
                    label="Tipo"
                    id="recurring_type"
                    value={formData.recurring_type}
                    options={[
                      { label: 'Assinatura', value: 'Assinatura' },
                      { label: 'Parcelamento', value: 'Parcelas' }
                    ]}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurring_type: e.target.value }))}
                  />
                </div>
                {formData.recurring_type === 'Parcelas' && (
                  <div>
                    <Label htmlFor="recurring_installment_count">Número de parcelas</Label>
                    <input
                      id="recurring_installment_count"
                      type="number"
                      min={2}
                      value={formData.recurring_installment_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_installment_count: e.target.value }))}
                      placeholder="Ex: 12"
                      className={inputClasses}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
};

export default TransactionForm;
