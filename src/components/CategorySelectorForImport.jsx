import React, { useState } from 'react';
import { Plus } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ColorPicker from '@/components/ui/ColorPicker';
import IconSelector from '@/components/IconSelector';

const CategorySelectorForImport = ({ value, onChange }) => {
  const { categories, addCategory } = useFinance();
  const [isCreating, setIsCreating] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color: '#3b82f6', icon: 'bx bx-tag' });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    try {
      const created = await addCategory(newCat);
      if (created) {
        onChange(created.id);
        setIsCreating(false);
        setNewCat({ name: '', color: '#3b82f6', icon: 'bx bx-tag' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <select 
        className="w-full text-xs py-1.5 px-2 rounded border border-border bg-background outline-none hover:border-primary focus:border-primary"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Sem categoria</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      
      <Button 
        type="button" 
        variant="outline" 
        size="icon" 
        className="h-7 w-7 flex-shrink-0" 
        onClick={() => setIsCreating(true)}
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input 
                type="text" 
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={newCat.name}
                onChange={e => setNewCat({...newCat, name: e.target.value})}
                required
              />
            </div>
            <ColorPicker value={newCat.color} onChange={color => setNewCat({...newCat, color})} />
            <IconSelector selectedIcon={newCat.icon} onSelect={icon => setNewCat({...newCat, icon})} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button type="submit">Criar Categoria</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategorySelectorForImport;