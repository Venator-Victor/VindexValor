import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/ui/DatePicker';
import SelectInput from '@/components/ui/SelectInput';
import NumberInput from '@/components/ui/NumberInput';
import { ArrowDownRight, ArrowUpRight } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';

const InvoiceItemForm = ({ invoiceId, initialData, onSuccess, onCancel }) => {
  const { categories, accounts, transactions, createInvoiceItem, updateInvoiceItem } = useFinance();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState('expense');

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    account_id: '',
    transaction_id: '',
    amount: ''
  });

  useEffect(() => {
    if (initialData) {
      const initialType = Number(initialData.amount) >= 0 ? 'income' : 'expense';
      setType(initialType);
      setFormData({
        date: initialData.date || new Date().toISOString().split('T')[0],
        description: initialData.description || '',
        category_id: initialData.category_id || '',
        account_id: initialData.account_id || '',
        transaction_id: initialData.transaction_id || '',
        amount: Math.abs(Number(initialData.amount || 0))
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.description || !formData.amount) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
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
        amount: finalValor
      };

      if (initialData) {
        await updateInvoiceItem(initialData.id, payload);
        toast({ title: "Compra atualizada com sucesso!" });
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
          
        toast({ title: "Compra adicionada com sucesso!" });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao salvar a compra.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const eligibleTransactions = transactions.filter(t => t.date.startsWith(formData.date.substring(0, 7)));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Tipo da Movimentação *</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            type="button"
            variant={type === 'expense' ? 'default' : 'outline'}
            className={type === 'expense' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-muted-foreground'}
            onClick={() => setType('expense')}
          >
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Saída (Despesa)
          </Button>
          <Button
            type="button"
            variant={type === 'income' ? 'default' : 'outline'}
            className={type === 'income' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-muted-foreground'}
            onClick={() => setType('income')}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Entrada (Reembolso)
          </Button>
        </div>
      </div>

      <div>
        <DatePicker
          label="Data da Movimentação *"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, data: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <input
          id="description"
          className="w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 focus:ring-1 focus:ring-primary outline-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Supermercado, Estorno Uber..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Categoria"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          options={[
            { label: "Selecione...", value: "" },
            ...categories.map(c => ({ label: c.name, value: c.id }))
          ]}
        />
        <SelectInput
          label="Conta"
          value={formData.account_id}
          onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
          options={[
            { label: "Selecione...", value: "" },
            ...accounts.map(a => ({ label: a.name, value: a.id }))
          ]}
        />
      </div>

      <div>
        <SelectInput
          label="Vincular a Transação (Opcional)"
          value={formData.transaction_id}
          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
          options={[
            { label: "Nenhuma transação vinculada", value: "" },
            ...eligibleTransactions.map(t => ({ label: `${t.description} - R$ ${Math.abs(t.amount)}`, value: t.id }))
          ]}
        />
      </div>

      <div>
        <Label htmlFor="amount">Valor *</Label>
        <div className="mt-1 relative flex items-center">
          <div className={`absolute left-3 font-bold text-lg pointer-events-none z-10 ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
            {type === 'expense' ? '-' : '+'}
          </div>
          <div className="w-full pl-6">
            <NumberInput
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              currencyCode="BRL"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-6">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Movimentação'}
        </Button>
      </div>
    </form>
  );
};

export default InvoiceItemForm;