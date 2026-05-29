import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import SelectInput from '@/components/ui/SelectInput';
import NumberInput from '@/components/ui/NumberInput';
import DatePicker from '@/components/ui/DatePicker';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';
import { formatCurrency } from '@/utils/calculations';
import { PERIOD_OPTIONS } from '@/utils/periodOptions';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MetaForm = ({ initialData, initialName, onSubmit, onCancel }) => {
  const { accounts } = useFinance();
  const { toast } = useToast();
  
  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'valor_final', // 'valor_final' | 'valor_mensal'
    targetAmount: '',
    contributionValue: '',
    periodFrequency: 'Mensal',
    accumulated_amount: '',
    deadline: '',
    description: '',
    color: '#3b82f6',
    icon: 'bx-target-lock'
  });

  // State for multiple account reservations
  const [reservations, setReservations] = useState([]); // [{ account_id, amount }]
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        goal_type: initialData.goal_type || 'valor_final',
        targetAmount: initialData.targetAmount || '',
        contributionValue: initialData.contributionValue || '',
        periodFrequency: initialData.periodFrequency || 'Mensal',
        accumulated_amount: initialData.accumulated_amount || initialData.currentAmount || '',
        deadline: initialData.deadline || '',
        description: initialData.description || '',
        color: initialData.color || '#3b82f6',
        icon: initialData.icon || 'bx-target-lock'
      });

      // Handle legacy single account or new multiple accounts
      if (initialData.accountReservations && initialData.accountReservations.length > 0) {
        setReservations(initialData.accountReservations);
      } else if (initialData.reserved_account_id) {
        // Legacy support conversion
        setReservations([{
          account_id: initialData.reserved_account_id,
          amount: initialData.reserved_amount || 0
        }]);
      }
    } else if (initialName) {
      setFormData(prev => ({ ...prev, name: initialName }));
    }
  }, [initialData, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Erro", description: "O nome da meta é obrigatório.", variant: "destructive" });
      return;
    }

    // Deadline is now optional, removed validation check

    // Construct submission object
    const submissionData = {
      ...formData,
      accountReservations: reservations
    };

    onSubmit(submissionData);
  };

  // --- Reservation Logic ---
  const handleAddReservation = () => {
    if (!selectedAccountId) return;
    
    // Check if already exists
    if (reservations.some(r => r.account_id === selectedAccountId)) {
      return;
    }

    setReservations([...reservations, { account_id: selectedAccountId, amount: '' }]);
    setSelectedAccountId('');
  };

  const handleRemoveReservation = (accountId) => {
    setReservations(reservations.filter(r => r.account_id !== accountId));
  };

  const handleReservationAmountChange = (accountId, amount) => {
    setReservations(reservations.map(r => 
      r.account_id === accountId ? { ...r, amount } : r
    ));
  };

  const totalReserved = reservations.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // Filter available accounts for dropdown (exclude already selected)
  const availableAccounts = accounts.filter(acc => 
    !reservations.some(r => r.account_id === acc.id)
  );

  const accountOptions = [
    { label: "Selecione uma conta...", value: "" },
    ...availableAccounts.map(acc => ({ label: acc.name, value: acc.id }))
  ];

  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1. Goal Type Selection */}
      <div className="bg-gray-50 dark:bg-vindex-bg/50 p-1 rounded-lg flex">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, goal_type: 'valor_final' })}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            formData.goal_type === 'valor_final' 
              ? 'bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <i className='bx bx-target-lock mr-2'></i>
          Valor Final
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, goal_type: 'valor_mensal' })}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            formData.goal_type === 'valor_mensal' 
              ? 'bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <i className='bx bx-calendar-star mr-2'></i>
          Recorrência
        </button>
      </div>

      {/* 2. Basic Info */}
      <div>
        <Label htmlFor="name">Nome da Meta <span className="text-red-500">*</span></Label>
        <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 mt-1 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
            required
            placeholder="Ex: Minha Casa Nova"
        />
      </div>

      {/* 3. Dynamic Fields Based on Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
        {formData.goal_type === 'valor_final' ? (
          <div>
            <Label htmlFor="targetAmount">Valor Alvo (R$) <span className="text-red-500">*</span></Label>
            <NumberInput
              id="targetAmount"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              placeholder="0,00"
              required={formData.goal_type === 'valor_final'}
            />
          </div>
        ) : (
          <>
             <div>
                <Label htmlFor="contributionValue">Valor da Contribuição (R$) <span className="text-red-500">*</span></Label>
                <NumberInput
                  id="contributionValue"
                  value={formData.contributionValue}
                  onChange={(e) => setFormData({ ...formData, contributionValue: e.target.value })}
                  placeholder="0,00"
                  required={formData.goal_type === 'valor_mensal'}
                />
             </div>
             <div>
                 <Label htmlFor="periodFrequency">Frequência</Label>
                 <SelectInput 
                    id="periodFrequency"
                    value={formData.periodFrequency}
                    onChange={(e) => setFormData({...formData, periodFrequency: e.target.value})}
                    options={PERIOD_OPTIONS}
                 />
             </div>
          </>
        )}
        
        {/* Deadline - Now Optional */}
        <div>
          <Label htmlFor="deadline">Prazo Alvo (Opcional)</Label>
          <DatePicker 
            id="deadline"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
      </div>

      {/* 4. Total Accumulated (Common Field) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accumulated_amount">Valor Total Acumulado (R$)</Label>
            <NumberInput
              id="accumulated_amount"
              value={formData.accumulated_amount}
              onChange={(e) => setFormData({ ...formData, accumulated_amount: e.target.value })}
              placeholder="0,00"
            />
            <p className="text-xs text-gray-500 mt-1">Soma de reservas e outras economias.</p>
          </div>
      </div>

      {/* 5. Account Reservations (Multiple) */}
      <div className="p-4 bg-gray-50 dark:bg-vindex-bg/50 rounded-lg border border-gray-100 dark:border-vindex-border/50 space-y-3">
          <div className="flex justify-between items-center">
             <Label className="text-gray-700 dark:text-gray-300 font-semibold">Reserva em Contas (Opcional)</Label>
             <span className="text-xs font-mono font-medium text-gray-500 bg-white dark:bg-vindex-card px-2 py-1 rounded border dark:border-vindex-border">
                Total Reservado: {formatCurrency(totalReserved)}
             </span>
          </div>
          
          {/* Account Selector */}
          <div className="flex gap-2">
             <div className="flex-1">
               <SelectInput
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  options={accountOptions}
                  placeholder="Adicionar conta..."
               />
             </div>
             <Button 
                type="button" 
                onClick={handleAddReservation}
                disabled={!selectedAccountId}
                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
             >
                <Plus className="w-4 h-4" />
             </Button>
          </div>

          {/* List of Reservations */}
          <div className="space-y-2 mt-2">
             {reservations.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500 italic border-dashed border border-gray-200 dark:border-vindex-border rounded-lg">
                   Nenhuma conta vinculada
                </div>
             )}
             
             {reservations.map((res) => {
                const account = accounts.find(a => a.id === res.account_id);
                if (!account) return null;
                return (
                   <div key={res.account_id} className="flex items-center gap-3 bg-white dark:bg-vindex-card p-2 rounded-lg border border-gray-100 dark:border-vindex-border animate-in slide-in-from-left-2">
                      <div className="flex-1">
                         <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{account.name}</div>
                         <div className="text-xs text-gray-500">Saldo Disp: {formatCurrency(account.balance)}</div>
                      </div>
                      <div className="w-32">
                         <NumberInput
                            value={res.amount}
                            onChange={(e) => handleReservationAmountChange(res.account_id, e.target.value)}
                            placeholder="0,00"
                            className="h-8 text-sm"
                         />
                      </div>
                      <Button
                         type="button"
                         variant="ghost"
                         size="icon"
                         onClick={() => handleRemoveReservation(res.account_id)}
                         className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                         <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                );
             })}
          </div>
      </div>

      {/* 6. Description */}
      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 mt-1 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 min-h-[80px]"
          placeholder="Detalhes opcionais..."
        />
      </div>

      {/* 7. Customization (Vertical Stacked Layout) */}
      <div className="space-y-4 pt-2">
          <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personalização</Label>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-vindex-bg/30 border border-gray-100 dark:border-vindex-border/50">
             <ColorPicker 
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
             />
          </div>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-vindex-bg/30 border border-gray-100 dark:border-vindex-border/50">
             <IconSelector 
                selectedIcon={formData.icon}
                onSelect={(icon) => setFormData({ ...formData, icon })}
             />
          </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
        <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg h-11 font-medium shadow-sm transition-all hover:shadow-md">
          {initialData ? 'Salvar Alterações' : 'Criar Meta'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6 border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default MetaForm;