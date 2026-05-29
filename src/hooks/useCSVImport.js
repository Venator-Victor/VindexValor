import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useFinance } from '@/context/FinanceContext';
import { useCustomCategoryMappings } from './useCustomCategoryMappings';

export const useCSVImport = () => {
  const { user } = useAuth();
  const { categories } = useFinance();
  const { mappings } = useCustomCategoryMappings();
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const normalizeHeader = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const getFieldValue = (row, possibleKeys) => {
    const key = Object.keys(row).find(k => possibleKeys.includes(normalizeHeader(k)));
    return key ? row[key] : '';
  };

  const dateVars = ['date', 'data', 'data_transacao'];
  const valVars = ['amount', 'value', 'valor', 'preço', 'preco'];
  const descVars = ['title', 'descricao', 'description', 'nome', 'produto'];
  const idVars = ['identificador', 'id', 'transaction_id'];

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const normFields = headers.map(normalizeHeader);
          
          const hasData = normFields.some(f => dateVars.includes(f));
          const hasValor = normFields.some(f => valVars.includes(f));
          const hasDesc = normFields.some(f => descVars.includes(f));
          const hasId = normFields.some(f => idVars.includes(f));
          
          const availableCols = headers.join(', ');

          if (!hasData) return reject(new Error(`Coluna de data não encontrada. Colunas disponíveis: [${availableCols}]. Aceitas variações: ${dateVars.join(', ')}`));
          if (!hasValor) return reject(new Error(`Coluna de valor não encontrada. Colunas disponíveis: [${availableCols}]. Aceitas variações: ${valVars.join(', ')}`));
          if (!hasDesc) return reject(new Error(`Coluna de descrição não encontrada. Colunas disponíveis: [${availableCols}]. Aceitas variações: ${descVars.join(', ')}`));
          if (!hasId) return reject(new Error(`Coluna de identificador não encontrada. Colunas disponíveis: [${availableCols}]. Aceitas variações: ${idVars.join(', ')}`));

          const mappedData = results.data.map(row => {
            const rawValor = getFieldValue(row, valVars);
            let valStr = String(rawValor).trim();
            
            // Retain only digits, minus sign, comma, and dot
            valStr = valStr.replace(/[^\d.,-]/g, '');
            
            if (valStr.includes('.') && valStr.includes(',')) {
              valStr = valStr.replace(/\./g, '').replace(',', '.');
            } else if (valStr.includes(',')) {
              valStr = valStr.replace(',', '.');
            }
            
            const numValor = parseFloat(valStr) || 0;
            const rawDesc = getFieldValue(row, descVars);
            const rawData = getFieldValue(row, dateVars);
            const rawId = getFieldValue(row, idVars);

            let parsedDate = rawData;
            if (rawData.includes('/')) {
              const parts = rawData.split('/');
              if (parts.length === 3) {
                const [p1, p2, p3] = parts;
                if (p3.length === 4) {
                  parsedDate = `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
                }
              }
            }

            let catId = null;
            let catName = "Sem categoria";
            const descLower = String(rawDesc).toLowerCase().trim();
            
            const existingMapping = mappings.find(m => descLower.includes(m.description));
            
            if (existingMapping) {
              catId = existingMapping.categoria_id;
              catName = existingMapping.categorias?.name || "Desconhecida";
            } else if (categories && categories.length > 0) {
              for (let cat of categories) {
                if (descLower.includes(cat.name.toLowerCase())) {
                  catId = cat.id;
                  catName = cat.name;
                  break;
                }
              }
            }

            return {
              date: parsedDate,
              description: rawDesc,
              originalAmount: numValor,
              amount: numValor, // Preserves the exact negative/positive sign
              type: numValor >= 0 ? 'entrada' : 'saida',
              categoria_id: catId,
              categoria_name: catName,
              identificador: rawId,
              _sourceFile: file.name
            };
          });

          resolve(mappedData);
        },
        error: (err) => reject(new Error(`Erro ao ler o arquivo ${file.name}.`))
      });
    });
  };

  const parseMultipleCSVs = async (files) => {
    setIsParsing(true);
    try {
      const allPromises = Array.from(files).map(file => parseCSVFile(file));
      const results = await Promise.all(allPromises);
      return results.reduce((acc, curr) => acc.concat(curr), []);
    } finally {
      setIsParsing(false);
    }
  };

  const importData = async (transactions, accountId) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    setIsImporting(true);
    try {
      const dbData = transactions.map(t => {
        return {
          user_id: user.id,
          description: t.description,
          amount: t.amount, // Directly use parsed signed amount
          type: t.type,
          date: t.date,
          categoria_id: t.categoria_id,
          conta_id: accountId,
          is_recurring: false
        };
      });

      const { data, error } = await supabase.from('transactions').insert(dbData).select();
      if (error) throw error;
      
      return data ? data.length : 0;
    } catch (error) {
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return { parseMultipleCSVs, importData, isParsing, isImporting };
};