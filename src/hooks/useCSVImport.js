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

  const normalizeHeader = (str) =>
    str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const dateVars = ['date', 'data', 'data_transacao'];
  const valVars  = ['amount', 'value', 'valor', 'preço', 'preco'];
  const descVars = ['title', 'descricao', 'description', 'nome', 'produto'];

  const parseDate = (rawDate) => {
    if (!rawDate) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) return rawDate.substring(0, 10);
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        const [p1, p2, p3] = parts;
        if (p3.length === 4) return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
      }
    }
    return rawDate;
  };

  // Parse file without column detection — returns raw headers + rows
  const parseCSVFileRaw = (file) =>
    new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) =>
          resolve({ headers: results.meta.fields || [], data: results.data, fileName: file.name }),
        error: () => reject(new Error(`Erro ao ler o arquivo ${file.name}.`)),
      });
    });

  const parseMultipleCSVsRaw = async (files) => {
    setIsParsing(true);
    try {
      const results = await Promise.all(Array.from(files).map(parseCSVFileRaw));
      const headers = results[0]?.headers || [];
      const data = results.flatMap(r => r.data.map(row => ({ ...row, _sourceFile: r.fileName })));
      return { headers, data };
    } finally {
      setIsParsing(false);
    }
  };

  // Auto-detect which header matches each field
  const autoDetectMapping = (headers) => {
    const find = (vars) => headers.find(h => vars.includes(normalizeHeader(h))) || '';
    return {
      date:        find(dateVars),
      description: find(descVars),
      amount:      find(valVars),
    };
  };

  // Apply a confirmed column mapping to raw rows
  const applyColumnMapping = (rawData, mapping) => {
    return rawData.map(row => {
      const rawValor = row[mapping.amount];
      let valStr = String(rawValor || '').trim().replace(/[^\d.,-]/g, '');
      if (valStr.includes('.') && valStr.includes(',')) {
        valStr = valStr.replace(/\./g, '').replace(',', '.');
      } else if (valStr.includes(',')) {
        valStr = valStr.replace(',', '.');
      }
      const numValor = parseFloat(valStr) || 0;

      const rawDesc = String(row[mapping.description] || '').trim();
      const parsedDate = parseDate(String(row[mapping.date] || '').trim());

      let catId = null;
      let catName = 'Sem categoria';
      const descLower = rawDesc.toLowerCase();
      const existingMapping = mappings.find(m => descLower.includes(m.description));
      if (existingMapping) {
        catId = existingMapping.category_id;
        catName = existingMapping.categories?.name || 'Desconhecida';
      } else if (categories?.length > 0) {
        for (const cat of categories) {
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
        amount: numValor,
        type: numValor >= 0 ? 'income' : 'expense',
        category_id: catId,
        categoria_name: catName,
        _sourceFile: row._sourceFile,
      };
    });
  };

  const importData = async (transactions, accountId) => {
    if (!user || !user.id) throw new Error('Usuário não autenticado');
    setIsImporting(true);
    try {
      const dbData = transactions.map(t => ({
        user_id: user.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        date: t.date,
        category_id: t.category_id || null,
        account_id: accountId,
        is_recurring: false,
      }));
      const { data, error } = await supabase.from('transactions').insert(dbData).select();
      if (error) throw error;
      return data ? data.length : 0;
    } finally {
      setIsImporting(false);
    }
  };

  return { parseMultipleCSVsRaw, autoDetectMapping, applyColumnMapping, importData, isParsing, isImporting };
};