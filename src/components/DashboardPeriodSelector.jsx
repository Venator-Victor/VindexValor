import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from 'lucide-react';

const DashboardPeriodSelector = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-2">
        <CalendarDays className="w-4 h-4" />
        <span>Período:</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Diário">Diário</SelectItem>
          <SelectItem value="Semanal">Semanal (7 dias)</SelectItem>
          <SelectItem value="Quinzenal">Quinzenal (15 dias)</SelectItem>
          <SelectItem value="Mensal">Mensal</SelectItem>
          <SelectItem value="Trimestral">Trimestral</SelectItem>
          <SelectItem value="Semestral">Semestral</SelectItem>
          <SelectItem value="Anual">Anual</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DashboardPeriodSelector;