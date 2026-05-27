import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SelectInput from '@/components/ui/SelectInput';
import FilterRangeInput from './FilterRangeInput';
import { useFinance } from '@/context/FinanceContext';
import InfoTooltip from './InfoTooltip';

const InvoiceFilterBar = ({ onFilterChange }) => {
  const { categories, accounts } = useFinance();
  
  const [filters, setFilters] = useState({
    search: '',
    valorRange: '',
    categoria_id: '',
    parcelamento: 'todos',
    conta_id: ''
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const cleared = {
      search: '',
      valorRange: '',
      categoria_id: '',
      parcelamento: 'todos',
      conta_id: ''
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'parcelamento') return v !== 'todos';
    if (k === 'valorRange') return v.trim() !== '';
    return v !== '';
  }).length;

  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Filter className="w-4 h-4" /> 
          Filtros Avançados
          
          <InfoTooltip content={
            <div className="space-y-1 text-sm">
              <p><strong>Campo Valor:</strong> Use sinais =, &gt;, &lt; (ex: &gt;100; &lt;1000)</p>
              <p><strong>Campo Descrição:</strong> Buscar por nome ou descrição</p>
            </div>
          } />

          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-2">
              {activeCount} ativo{activeCount !== 1 && 's'}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-xs text-muted-foreground hover:text-foreground">
            Limpar Filtros <X className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative flex flex-col lg:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm text-foreground focus:ring-1 focus:ring-primary outline-none h-[42px]"
            />
          </div>
        </div>

        {/* Value Range String Filter */}
        <div className="lg:col-span-1">
          <FilterRangeInput
            value={filters.valorRange}
            onChange={(val) => handleChange('valorRange', val)}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col lg:col-span-1">
          <SelectInput
            value={filters.categoria_id}
            onChange={(e) => handleChange('categoria_id', e.target.value)}
            options={[
              { label: "Todas categorias", value: "" },
              ...categories.map(c => ({ label: c.name, value: c.id }))
            ]}
          />
        </div>

        {/* Parcelamento */}
        <div className="flex flex-col lg:col-span-1">
          <SelectInput
            value={filters.parcelamento}
            onChange={(e) => handleChange('parcelamento', e.target.value)}
            options={[
              { label: "Todos (Parcelados ou Não)", value: "todos" },
              { label: "Apenas Parcelados", value: "parcelado" },
              { label: "Não Parcelados", value: "nao_parcelado" }
            ]}
          />
        </div>

        {/* Account */}
        <div className="flex flex-col lg:col-span-1">
          <SelectInput
            value={filters.conta_id}
            onChange={(e) => handleChange('conta_id', e.target.value)}
            options={[
              { label: "Todas contas", value: "" },
              ...accounts.map(a => ({ label: a.name, value: a.id }))
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilterBar;