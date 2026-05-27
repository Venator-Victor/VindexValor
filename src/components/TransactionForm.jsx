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

const TransactionForm = ({ initialData, onSuccess, onCancel }) => {
  const { accounts, categories, faturas, createTransaction, updateTransaction } = useFinance();
  const { saveCategoryMapping, getSuggestedCategory } = useAutoMappingCategories();
  const { toast } = useToast();
  
  const [isAutoMapped, setIsAutoMapped] = useState(false);
  const debounceRef = useRef(null);

  const [formData, setFormData] = useState({
    tipo: 'saida',
    recorrente: false,
    tipoRecorrente: '',
    valor: '',
    converted_amount: '',
    descricao: '',
    data: new Date().toISOString().slice(0, 10),
    categoria_id: '',
    conta_id: '',
    conta_destino_id: '',
    fatura_id: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        tipo: initialData.type || 'saida',
        recorrente: initialData.is_recurring || false,
        tipoRecorrente: initialData.tipo_recorrente || '',
        valor: Math.abs(initialData.amount) || '',
        converted_amount: initialData.converted_amount || '',
        descricao: initialData.description || '',
        data: initialData.date || new Date().toISOString().slice(0, 10),
        categoria_id: initialData.categoria_id || '',
        conta_id: initialData.conta_id || '',
        conta_destino_id: initialData.conta_destino_id || '',
        fatura_id: initialData.fatura_id || ''
      });
      setIsAutoMapped(false);
    }
  }, [initialData]);

  const sourceAccount = useMemo(() => accounts.find(a => a.id === formData.conta_id), [accounts, formData.conta_id]);
  const destAccount = useMemo(() => accounts.find(a => a.id === formData.conta_destino_id), [accounts, formData.conta_destino_id]);

  const isCrossCurrencyTransfer = formData.tipo === 'transferencia' && 
                                  sourceAccount && 
                                  destAccount && 
                                  sourceAccount.currency !== destAccount.currency;

  const handleDescriptionChange = (e) => {
    const newDesc = e.target.value;
    setFormData(prev => ({ ...prev, descricao: newDesc }));
    
    if (formData.tipo !== 'transferencia' && formData.tipo !== 'pagamento' && (!initialData || !initialData.categoria_id)) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (newDesc.trim().length > 2) {
          const suggestedId = getSuggestedCategory(newDesc);
          if (suggestedId) {
            setFormData(prev => ({ ...prev, categoria_id: suggestedId }));
            setIsAutoMapped(true);
          }
        }
      }, 500);
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, categoria_id: value });
    setIsAutoMapped(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (formData.tipo !== 'pagamento' && formData.fatura_id) {
        toast({ title: "Erro de Validação", description: "Apenas pagamentos podem ter faturas vinculadas.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const original_amount = Math.abs(Number(formData.valor));
      let finalAmount = (formData.tipo === 'saida' || formData.tipo === 'transferencia' || formData.tipo === 'pagamento') ? -original_amount : original_amount;
      
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
        valor: finalAmount,
        original_amount: original_amount,
        converted_amount: converted_amount,
        exchange_rate: exchange_rate,
        fatura_id: formData.tipo === 'pagamento' ? (formData.fatura_id || null) : null,
        categoria_id: (formData.tipo === 'transferencia' || formData.tipo === 'pagamento') ? null : formData.categoria_id
      };

      if (initialData) {
        await updateTransaction(initialData.id, payload);
      } else {
        await createTransaction(payload);
      }

      if (formData.descricao && formData.categoria_id && formData.tipo !== 'transferencia' && formData.tipo !== 'pagamento' && !isAutoMapped) {
        await saveCategoryMapping(formData.descricao, formData.categoria_id);
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
              label="Tipo de Transação"
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                tipo: e.target.value,
                recorrente: (e.target.value === 'transferencia' || e.target.value === 'pagamento') ? false : prev.recorrente,
                categoria_id: (e.target.value === 'transferencia' || e.target.value === 'pagamento') ? '' : prev.categoria_id
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
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <textarea
            id="descricao"
            value={formData.descricao}
            onChange={handleDescriptionChange}
            placeholder="Ex: Compra, Recebimento, Transferência..."
            className={inputClasses}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="conta_id">
              {formData.tipo === 'transferencia' ? 'Conta Origem *' : 
               formData.tipo === 'pagamento' ? 'Conta de Pagamento *' : 'Conta *'}
            </Label>
            <select
              id="conta_id"
              value={formData.conta_id}
              onChange={(e) => setFormData({ ...formData, conta_id: e.target.value })}
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

          {formData.tipo === 'transferencia' && (
            <div>
              <Label htmlFor="conta_destino_id">Conta Destino *</Label>
              <select
                id="conta_destino_id"
                value={formData.conta_destino_id}
                onChange={(e) => setFormData({ ...formData, conta_destino_id: e.target.value })}
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

          {formData.tipo === 'pagamento' && (
            <div>
              <Label htmlFor="fatura_id">Fatura a Pagar *</Label>
              <select
                id="fatura_id"
                value={formData.fatura_id}
                onChange={(e) => setFormData({ ...formData, fatura_id: e.target.value })}
                className={inputClasses}
                required
              >
                <option value="">Selecione uma fatura...</option>
                {faturas.map(fat => (
                  <option key={fat.id} value={fat.id}>
                    {fat.numero_fatura || 'Sem número'} - {formatCurrencyWithSymbol(fat.valor_total, 'BRL')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="valor">Valor {sourceAccount ? `em ${sourceAccount.currency}` : ''} *</Label>
            <div className="relative mt-1">
              <NumberInput
                id="valor"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
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

        {formData.tipo !== 'transferencia' && formData.tipo !== 'pagamento' && (
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="categoria_id" className="mb-0">Categoria</Label>
              {isAutoMapped && formData.categoria_id && (
                <Badge variant="secondary" className="h-5 text-[10px] gap-1 bg-blue-50 text-blue-600 border-none">
                  <Sparkles className="w-3 h-3" /> Sugerido
                </Badge>
              )}
            </div>
            <select
              id="categoria_id"
              value={formData.categoria_id}
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