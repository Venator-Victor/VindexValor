import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';
import NumberInput from '@/components/ui/NumberInput';
import SelectInput from '@/components/ui/SelectInput';
import { CHART_PERIOD_OPTIONS } from '@/utils/periodOptions';

const CreateCategoryModal = ({ open, onOpenChange, onCategoryCreated }) => {
  const { categories, createCategory } = useFinance();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#10B981',
    icon: 'bx-purchase-tag',
    spending_limit: '',
    budget_period: 'mensal'
  });

  const periodoOptions = CHART_PERIOD_OPTIONS.slice(3); // Mensal → Anual (lowercase)

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({ title: "Erro", description: "O nome da categoria é obrigatório.", variant: "destructive" });
      return;
    }
    
    const isDuplicate = categories.some(cat => cat.name.toLowerCase() === formData.name.toLowerCase());
    if (isDuplicate) {
      toast({ title: "Erro", description: "Já existe uma categoria com este nome.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        name: formData.name,
        color: formData.color,
        icon: formData.icon,
        spending_limit: formData.spending_limit ? parseFloat(formData.spending_limit) : null,
        budget_period: formData.spending_limit ? formData.budget_period : null
      };
      
      const newCategory = await createCategory(dataToSubmit);
      toast({ title: "Categoria criada com sucesso!" });
      if (onCategoryCreated) {
        // Pass both name and object to handle generic forms
        onCategoryCreated(newCategory.name, newCategory);
      }
      onOpenChange(false);
      
      // Reset form
      setFormData({ 
        name: '', 
        color: '#10B981', 
        icon: 'bx-purchase-tag',
        spending_limit: '',
        budget_period: 'mensal'
      });
    } catch (error) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-vindex-card">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-vindex-text">Nova Categoria</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="categoryName">Nome *</Label>
            <input
              id="categoryName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-lg bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Alimentação, Lazer..."
              required
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="spending_limit">Orçamento (Opcional)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-gray-500 font-medium z-10">R$</span>
                <NumberInput
                  id="spending_limit"
                  value={formData.spending_limit}
                  onChange={(e) => setFormData({ ...formData, spending_limit: e.target.value })}
                  className="pl-10 w-full"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="flex-1">
              <SelectInput
                id="budget_period"
                label="Período do Orçamento"
                value={formData.budget_period}
                onChange={(e) => setFormData({ ...formData, budget_period: e.target.value })}
                options={periodoOptions}
                disabled={!formData.spending_limit}
              />
            </div>
          </div>

          <div>
            <Label className="block mb-1">Cor</Label>
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
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
              className="border-gray-200 dark:border-vindex-border hover:bg-gray-100 dark:hover:bg-vindex-bg"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/85 text-gray-900 font-medium border-none shadow-sm transition-colors"
            >
              {isSubmitting ? 'Salvando...' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryModal;