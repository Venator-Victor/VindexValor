import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/SupabaseAuthContext';

export const useInvoiceCSVImport = () => {
  const { user } = useAuth();
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const normalizeHeader = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const parseDate = (rawDate) => {
    if (!rawDate) return new Date().toISOString().split('T')[0];
    
    if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) return rawDate.substring(0, 10);
    
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length >= 3) {
        let y = parts[2];
        let m = parts[1];
        let d = parts[0];
        
        if (y.length === 2) y = `20${y}`;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch(e) {}
    
    return new Date().toISOString().split('T')[0];
  };

  const extractParcelamento = (description) => {
    const match = String(description).match(/(?:parcela\s+)?(\d{1,2})\/(\d{1,2})/i);
    if (match) {
      const current = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (current > 0 && total >= current) {
        return { isParcelado: true, current, total };
      }
    }
    return { isParcelado: false, current: null, total: null };
  };

  const parseCSVFileRaw = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            data: results.data
          });
        },
        error: (err) => reject(new Error(`Erro ao ler o arquivo: ${err.message}`))
      });
    });
  };

  const parseFilesRaw = async (files) => {
    setIsParsing(true);
    try {
      const file = files[0];
      return await parseCSVFileRaw(file);
    } finally {
      setIsParsing(false);
    }
  };

  const autoDetectMapping = (headers) => {
    const dateVars = ['date', 'data', 'data_transacao'];
    const valVars = ['amount', 'value', 'valor', 'preço', 'preco'];
    const descVars = ['title', 'description', 'description', 'nome', 'produto'];

    const findMatch = (vars) => headers.find(h => vars.includes(normalizeHeader(h))) || '';
    
    return {
      date: findMatch(dateVars),
      description: findMatch(descVars),
      amount: findMatch(valVars)
    };
  };

  const applyMapping = (rawData, mapping) => {
    return rawData.map(row => {
      const rawValor = row[mapping.amount];
      let valStr = String(rawValor || '').trim();
      
      if (valStr.includes('.') && valStr.includes(',')) {
        valStr = valStr.replace(/\./g, '').replace(',', '.');
      } else if (valStr.includes(',')) {
        valStr = valStr.replace(',', '.');
      }
      
      const numValor = parseFloat(valStr) || 0;
      const rawDesc = String(row[mapping.description] || '').trim();
      const rawDataDate = String(row[mapping.date] || '').trim();

      const parsedDate = parseDate(rawDataDate);
      const { isParcelado, current, total } = extractParcelamento(rawDesc);

      // Invert sign: negative values become positive (income), positive values become negative (expense)
      const finalValor = -numValor;

      return {
        date: parsedDate,
        description: rawDesc,
        amount: finalValor,
        category_id: '',
        is_installment: isParcelado,
        parcel_number: current,
        total_parcels: total
      };
    });
  };

  const importData = async (faturaId, transactions) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    if (!faturaId) throw new Error("ID da Fatura é obrigatório");
    
    setIsImporting(true);
    try {
      const dbData = transactions.map(t => ({
        user_id: user.id,
        invoice_id: faturaId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category_id: t.category_id || null,
        is_installment: t.is_installment,
        parcel_number: t.parcel_number,
        total_parcels: t.total_parcels
      }));

      const { data, error } = await supabase.from('invoice_items').insert(dbData).select();
      if (error) throw error;
      
      return { success: true, count: data ? data.length : 0 };
    } catch (error) {
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return { parseFilesRaw, autoDetectMapping, applyMapping, importData, isParsing, isImporting };
};