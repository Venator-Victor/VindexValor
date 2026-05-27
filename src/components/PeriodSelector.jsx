import React from 'react';
import SelectInput from '@/components/ui/SelectInput';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const PeriodSelector = ({ period, setPeriod, showBalance, setShowBalance }) => {
  const periodOptions = [
    { label: "Diário", value: "Diário" },
    { label: "Semanal", value: "Semanal" },
    { label: "Quinzenal", value: "Quinzenal" },
    { label: "Mensal", value: "Mensal" },
    { label: "Trimestral", value: "Trimestral" },
    { label: "Semestral", value: "Semestral" },
    { label: "Anual", value: "Anual" }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
      <div className="w-full sm:w-48">
        <SelectInput
          value={period}
          options={periodOptions}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-300"
        />
      </div>

      <Button
        onClick={() => setShowBalance(!showBalance)}
        variant="outline"
        className={`flex items-center gap-2 border-gray-200 dark:border-vindex-border ${
          showBalance
            ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50'
            : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-vindex-card dark:text-gray-400 dark:hover:bg-vindex-bg'
        }`}
      >
        {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
        <span>Saldo</span>
      </Button>
    </div>
  );
};

export default PeriodSelector;