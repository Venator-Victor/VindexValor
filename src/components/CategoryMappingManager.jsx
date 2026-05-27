import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Link as LinkIcon, Search } from 'lucide-react';
import { useCustomCategoryMappings } from '@/hooks/useCustomCategoryMappings';

const CategoryMappingManager = () => {
  const { mappings, loading, deleteMapping } = useCustomCategoryMappings();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredMappings = mappings.filter(m => 
    m.description.toLowerCase().includes(search.toLowerCase()) ||
    m.categorias?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LinkIcon className="h-4 w-4" />
          Mapeamentos Automáticos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Mapeamentos de Categoria</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar descrição ou categoria..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-md overflow-y-auto flex-1 bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Descrição (Texto no extrato)</th>
                  <th className="px-4 py-3 text-left font-medium">Categoria Atribuída</th>
                  <th className="px-4 py-3 text-right font-medium w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : filteredMappings.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum mapeamento encontrado.</td></tr>
                ) : (
                  filteredMappings.map(mapping => (
                    <tr key={mapping.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{mapping.description}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/10 text-secondary-foreground text-xs">
                          {mapping.categorias?.icon && <i className={mapping.categorias.icon}></i>}
                          {mapping.categorias?.name || 'Categoria Removida'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMapping(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryMappingManager;