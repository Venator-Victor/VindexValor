import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/ui/DatePicker';
import SelectInput from '@/components/ui/SelectInput';
import NumberInput from '@/components/ui/NumberInput';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const CompraFaturaForm = ({ faturaId, initialData, onSuccess, onCancel }) => {
  const { categories, accounts, transactions, createCompraFatura, updateCompraFatura } = useFinance();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipo, setTipo] = useState('saida');

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    categoria_id: '',
    conta_id: '',
    transacao_id: '',
    valor: ''
  });

  useEffect(() => {
    if (initialData) {
      const initialTipo = Number(initialData.valor) >= 0 ? 'entrada' : 'saida';
      setTipo(initialTipo);
      setFormData({
        data: initialData.data || new Date().toISOString().split('T')[0],
        descricao: initialData.descricao || '',
        categoria_id: initialData.categoria_id || '',
        conta_id: initialData.conta_id || '',
        transacao_id: initialData.transacao_id || '',
        valor: Math.abs(Number(initialData.valor || 0))
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.data || !formData.descricao || !formData.valor) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const numericValue = Number(formData.valor);
      const finalValor = tipo === 'saida' ? -Math.abs(numericValue) : Math.abs(numericValue);

      const payload = {
        fatura_id: faturaId,
        data: formData.data,
        descricao: formData.descricao,
        categoria_id: formData.categoria_id || null,
        conta_id: formData.conta_id || null,
        transacao_id: formData.transacao_id || null,
        valor: finalValor
      };

      if (initialData) {
        await updateCompraFatura(initialData.id, payload);
        toast({ title: "Compra atualizada com sucesso!" });
      } else {
        await createCompraFatura(payload);
        
        // Auto-update fatura data_fechamento to the first day of the next month
        const dataObj = new Date(formData.data);
        const nextMonth = new Date(dataObj.getUTCFullYear(), dataObj.getUTCMonth() + 1, 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];
        
        await supabase
          .from('faturas')
          .update({ data_fechamento: nextMonthStr })
          .eq('id', faturaId);
          
        toast({ title: "Compra adicionada com sucesso!" });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao salvar a compra.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const eligibleTransactions = transactions.filter(t => t.date.startsWith(formData.data.substring(0, 7)));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Tipo da Movimentação *</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            type="button"
            variant={tipo === 'saida' ? 'default' : 'outline'}
            className={tipo === 'saida' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-muted-foreground'}
            onClick={() => setTipo('saida')}
          >
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Saída (Despesa)
          </Button>
          <Button
            type="button"
            variant={tipo === 'entrada' ? 'default' : 'outline'}
            className={tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-muted-foreground'}
            onClick={() => setTipo('entrada')}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Entrada (Reembolso)
          </Button>
        </div>
      </div>

      <div>
        <DatePicker
          label="Data da Movimentação *"
          value={formData.data}
          onChange={(e) => setFormData({ ...formData, data: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição *</Label>
        <input
          id="descricao"
          className="w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 focus:ring-1 focus:ring-primary outline-none"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Supermercado, Estorno Uber..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Categoria"
          value={formData.categoria_id}
          onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
          options={[
            { label: "Selecione...", value: "" },
            ...categories.map(c => ({ label: c.name, value: c.id }))
          ]}
        />
        <SelectInput
          label="Conta"
          value={formData.conta_id}
          onChange={(e) => setFormData({ ...formData, conta_id: e.target.value })}
          options={[
            { label: "Selecione...", value: "" },
            ...accounts.map(a => ({ label: a.name, value: a.id }))
          ]}
        />
      </div>

      <div>
        <SelectInput
          label="Vincular a Transação (Opcional)"
          value={formData.transacao_id}
          onChange={(e) => setFormData({ ...formData, transacao_id: e.target.value })}
          options={[
            { label: "Nenhuma transação vinculada", value: "" },
            ...eligibleTransactions.map(t => ({ label: `${t.description} - R$ ${Math.abs(t.amount)}`, value: t.id }))
          ]}
        />
      </div>

      <div>
        <Label htmlFor="valor">Valor *</Label>
        <div className="mt-1 relative flex items-center">
          <div className={`absolute left-3 font-bold text-lg pointer-events-none z-10 ${tipo === 'saida' ? 'text-red-500' : 'text-green-500'}`}>
            {tipo === 'saida' ? '-' : '+'}
          </div>
          <div className="w-full pl-6">
            <NumberInput
              id="valor"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
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

export default CompraFaturaForm;