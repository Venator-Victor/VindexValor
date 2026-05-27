import React from 'react';
import { formatCurrency } from '@/utils/calculations';
import { CreditCard, Calendar, FileText } from 'lucide-react';
import CategorySelectorForImport from './CategorySelectorForImport';

const InvoiceImportPreview = ({ data, onUpdateRow }) => {
  if (!data || data.length === 0) return null;

  const handleCategoryChange = (index, newCategoryId) => {
    const newData = [...data];
    newData[index].categoria_id = newCategoryId;
    onUpdateRow(newData);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">Pré-visualização dos Dados</h3>
        <p className="text-sm text-muted-foreground">Revise as compras detectadas. Você pode atribuir categorias antes de importar.</p>
      </div>

      <div className="border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto bg-card shadow-sm custom-scrollbar">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/50 sticky top-0 border-b z-10">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs">
                <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Data</div>
              </th>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs">
                <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Descrição</div>
              </th>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs">Parcelamento</th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase text-xs">
                <div className="flex items-center justify-end gap-1"><CreditCard className="w-3.5 h-3.5" /> Valor</div>
              </th>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs">Categoria</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, i) => {
              const valColor = row.valor < 0 ? 'text-red-600 dark:text-red-400' : row.valor > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
              
              return (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {row.data}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <span className="truncate max-w-[200px] block" title={row.descricao}>
                      {row.descricao || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.is_parcelado ? (
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full whitespace-nowrap">
                        {row.parcel_number}/{row.total_parcels}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${valColor}`}>
                    {formatCurrency(row.valor)}
                  </td>
                  <td className="px-4 py-2 min-w-[180px]">
                    <CategorySelectorForImport 
                      value={row.categoria_id}
                      onChange={(val) => handleCategoryChange(i, val)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-right text-xs text-muted-foreground">
        Total: {data.length} compras detectadas
      </div>
    </div>
  );
};

export default InvoiceImportPreview;