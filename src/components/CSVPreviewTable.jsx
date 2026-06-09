import React from 'react';
import { formatCurrency } from '@/utils/calculations';
import { useFinance } from '@/context/FinanceContext';
import { Sparkle as Sparkles, Edit as Edit2 } from '@/components/BxIcon';
const CSVPreviewTable = ({ data, onUpdateRow }) => {
  const { categories } = useFinance();

  const handleCategoryChange = (index, newCategoryId) => {
    const selectedCategory = categories.find(c => c.id === newCategoryId);
    const row = data[index];
    
    onUpdateRow(index, {
      ...row,
      category_id: newCategoryId,
      categoria_name: selectedCategory ? selectedCategory.name : 'Sem categoria'
    });
  };

  return (
    <div className="w-full">
      <div className="mb-3 text-sm text-muted-foreground font-medium flex justify-between items-center">
        <span>Encontramos <span className="font-bold text-foreground">{data.length}</span> transações para importação:</span>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-blue-500" /> Auto-sugerido</span>
          <span className="flex items-center gap-1"><Edit2 className="w-3 h-3 text-green-500" /> Manual</span>
        </div>
      </div>
      
      <div className="border rounded-xl overflow-hidden max-h-[350px] overflow-y-auto bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 border-b z-10">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs tracking-wider">Data</th>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase text-xs tracking-wider">Valor</th>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs tracking-wider">Categoria</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, i) => {
              const valColor = row.originalAmount < 0 ? 'text-red-600 dark:text-red-400' : row.originalAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
              
              return (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="px-4 py-3 text-foreground truncate max-w-[200px]" title={row.description}>
                    {row.description || '-'}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${valColor}`}>
                    {formatCurrency(row.originalAmount)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative flex items-center gap-2">
                      <select 
                        className={`w-full max-w-[150px] text-xs py-1.5 px-2 rounded border-border bg-background outline-none focus:ring-1 focus:ring-primary ${
                          row.autoMapped ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' : 
                          row.manuallyMapped ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' : ''
                        }`}
                        value={row.category_id || ""}
                        onChange={(e) => handleCategoryChange(i, e.target.value)}
                      >
                        <option value="">Sem categoria</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {row.autoMapped && <Sparkles className="w-3.5 h-3.5 text-blue-500 absolute -left-4" title="Categoria sugerida automaticamente" />}
                      {row.manuallyMapped && <Edit2 className="w-3.5 h-3.5 text-green-500 absolute -left-4" title="Categoria alterada manualmente" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CSVPreviewTable;