import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import SelectInput from '@/components/ui/SelectInput';
import { useFinance } from '@/context/FinanceContext';
import { useCSVImport } from '@/hooks/useCSVImport';
import CSVPreviewTable from './CSVPreviewTable';
import ColumnMappingStep from './ColumnMappingStep';
import { Share as UploadCloud } from '@/components/BxIcon';
import { useAutoMappingCategories } from '@/hooks/useAutoMappingCategories';

// step: 'upload' | 'mapping' | 'preview'
const CSVImportFlow = ({ onSuccess, onCancel }) => {
  const { accounts } = useFinance();
  const { parseMultipleCSVsRaw, autoDetectMapping, applyColumnMapping, importData, isParsing, isImporting } = useCSVImport();
  const { getSuggestedCategory, saveCategoryMapping } = useAutoMappingCategories();

  const [step, setStep] = useState('upload');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [mapping, setMapping] = useState({ date: '', description: '', amount: '' });
  const [parsedData, setParsedData] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelected = async (e) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const { headers, data } = await parseMultipleCSVsRaw(e.target.files);
      setRawHeaders(headers);
      setRawData(data);
      setMapping(autoDetectMapping(headers));
      setStep('mapping');
    } catch (err) {
      setError(err.message || 'Erro ao processar arquivos.');
    }
  };

  const handleMappingConfirm = () => {
    const rows = applyColumnMapping(rawData, mapping).map(row => ({
      ...row,
      category_id: getSuggestedCategory(row.description) || '',
      autoMapped: !!getSuggestedCategory(row.description),
      manuallyMapped: false,
    }));
    setParsedData(rows);
    setStep('preview');
  };

  const handleUpdateRow = (index, updatedRow) => {
    const newData = [...parsedData];
    newData[index] = { ...updatedRow, autoMapped: false, manuallyMapped: true };
    setParsedData(newData);
  };

  const handleImport = async () => {
    if (!selectedAccount || !parsedData) {
      setError('Por favor, selecione uma conta de destino.');
      return;
    }
    setError(null);
    try {
      const count = await importData(parsedData, selectedAccount);
      parsedData.forEach(row => {
        if (row.manuallyMapped && row.category_id && row.description) {
          saveCategoryMapping(row.description, row.category_id);
        }
      });
      onSuccess(count);
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao importar as transações.');
    }
  };

  if (step === 'upload') {
    return (
      <div className="p-1">
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center bg-muted/30">
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Selecione um ou mais arquivos CSV</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Você poderá escolher qual coluna corresponde a cada campo na próxima etapa.
          </p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
            {isParsing ? 'Processando...' : 'Escolher Arquivos'}
          </Button>
          <input type="file" accept=".csv" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelected} />
          {error && <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg w-full">{error}</div>}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">Cancelar</Button>
        </div>
      </div>
    );
  }

  if (step === 'mapping') {
    return (
      <ColumnMappingStep
        headers={rawHeaders}
        mapping={mapping}
        onChange={setMapping}
        onConfirm={handleMappingConfirm}
        onBack={() => setStep('upload')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <CSVPreviewTable data={parsedData} onUpdateRow={handleUpdateRow} />

      <div className="bg-muted/30 p-5 rounded-xl border">
        <SelectInput
          label="Conta de Destino *"
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          options={[
            { label: 'Selecione a conta...', value: '' },
            ...accounts.map(acc => ({ label: acc.name, value: acc.id })),
          ]}
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Todas as transações listadas acima serão registradas nesta conta.
        </p>
      </div>

      {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
        <Button variant="outline" onClick={() => setStep('mapping')} disabled={isImporting}>
          Voltar
        </Button>
        <Button onClick={handleImport} disabled={!selectedAccount || isImporting}>
          {isImporting ? 'Importando...' : `Confirmar Importação (${parsedData.length})`}
        </Button>
      </div>
    </div>
  );
};

export default CSVImportFlow;