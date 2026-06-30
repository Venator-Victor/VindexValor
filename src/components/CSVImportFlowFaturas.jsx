import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import SelectInput from '@/components/ui/SelectInput';
import { useFinance } from '@/context/FinanceContext';
import { useInvoiceCSVImport } from '@/hooks/useInvoiceCSVImport';
import { Share as UploadCloud, AlertCircle, File as FileText, RefreshCw as Loader2, X } from '@/components/BxIcon';
import { useToast } from '@/components/ui/use-toast';
import MultiFileImportResults from './MultiFileImportResults';
import ColumnMappingStep from './ColumnMappingStep';

// step: 'upload' | 'mapping' | 'processing' | 'completed'
const CSVImportFlowFaturas = ({ onSuccess, onCancel }) => {
  const { accounts, createInvoice } = useFinance();
  const { parseFilesRaw, autoDetectMapping, applyMapping, importData } = useInvoiceCSVImport();
  const { toast } = useToast();

  const [step, setStep] = useState('upload');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAccountForAuto, setSelectedAccountForAuto] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [mapping, setMapping] = useState({ date: '', description: '', amount: '' });
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [results, setResults] = useState([]);

  const fileInputRef = useRef(null);

  const creditCardAccounts = accounts.filter(
    a => a.type === 'Cartão de Crédito' || a.account_subtype === 'credit_card'
  );

  const handleFileSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx));

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProceedToMapping = async () => {
    if (selectedFiles.length === 0) return;
    if (!selectedAccountForAuto) {
      toast({ title: 'Atenção', description: 'Selecione uma conta de cartão de crédito.', variant: 'destructive' });
      return;
    }
    try {
      const { headers } = await parseFilesRaw([selectedFiles[0]]);
      setRawHeaders(headers);
      setMapping(autoDetectMapping(headers));
      setStep('mapping');
    } catch (err) {
      toast({ title: 'Erro', description: err.message || 'Erro ao ler arquivo.', variant: 'destructive' });
    }
  };

  const processBatch = async () => {
    setStep('processing');
    setResults([]);
    setCurrentFileIndex(0);

    const newResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      setCurrentFileIndex(i);
      const file = selectedFiles[i];
      let resultItem = { fileName: file.name, status: 'error', count: 0, error: '' };

      try {
        const { data: rawData } = await parseFilesRaw([file]);
        const parsedData = applyMapping(rawData, mapping);

        if (parsedData.length === 0) throw new Error('Nenhum dado válido encontrado no arquivo.');

        const dates = parsedData.map(m => new Date(m.data)).filter(d => !isNaN(d.getTime()));
        let autoFaturaName = 'Fatura Importada';
        let minDateStr = new Date().toISOString().split('T')[0];
        let maxDateStr = new Date().toISOString().split('T')[0];

        if (dates.length > 0) {
          const earliest = new Date(Math.min(...dates));
          const nextMonthDate = new Date(earliest.getUTCFullYear(), earliest.getUTCMonth() + 1, 1);
          const monthStr = nextMonthDate.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' });
          const yearStr = nextMonthDate.getUTCFullYear();
          autoFaturaName = `Fatura ${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}/${yearStr}`;
          minDateStr = earliest.toISOString().split('T')[0];
          maxDateStr = nextMonthDate.toISOString().split('T')[0];
        }

        const newFatura = await createInvoice({
          invoice_number: autoFaturaName,
          account_id: selectedAccountForAuto,
          opening_date: minDateStr,
          closing_date: maxDateStr,
          status: 'open',
        });

        if (!newFatura?.id) throw new Error('Erro ao criar fatura no banco de dados.');

        const { count } = await importData(newFatura.id, parsedData);
        resultItem = { ...resultItem, status: 'success', count };
        successCount++;
      } catch (err) {
        resultItem.error = err.message || 'Erro desconhecido ao processar arquivo.';
        errorCount++;
      }

      newResults.push(resultItem);
      setResults([...newResults]);
    }

    setStep('completed');
    toast({
      title: 'Processamento em Lote Concluído',
      description: `${successCount} faturas importadas com sucesso, ${errorCount} erros.`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    if (successCount > 0) onSuccess();
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setStep('upload');
    setResults([]);
    setCurrentFileIndex(0);
  };

  if (step === 'completed') {
    return <MultiFileImportResults results={results} onClear={handleClear} />;
  }

  if (step === 'mapping') {
    return (
      <ColumnMappingStep
        headers={rawHeaders}
        mapping={mapping}
        onChange={setMapping}
        onConfirm={processBatch}
        onBack={() => setStep('upload')}
      />
    );
  }

  const isProcessing = step === 'processing';

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div className="p-1">
        <div className={`border-2 border-dashed border-border rounded-xl p-6 md:p-8 text-center flex flex-col items-center justify-center bg-muted/30 transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Importar Faturas em Lote</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Selecione múltiplos arquivos CSV. Você poderá confirmar o mapeamento de colunas antes do processamento.
          </p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            Selecionar Arquivos CSV
          </Button>
          <input type="file" accept=".csv" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelected} />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="bg-card p-4 rounded-xl border">
              <h4 className="font-semibold text-sm mb-3">Arquivos Selecionados ({selectedFiles.length})</h4>
              <ul className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {selectedFiles.map((file, idx) => (
                  <li key={`${file.name}-${idx}`} className={`flex items-center justify-between p-2 rounded-lg border text-sm ${isProcessing && currentFileIndex === idx ? 'border-primary bg-primary/5' : 'bg-background'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                    </div>
                    {!isProcessing ? (
                      <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive shrink-0 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    ) : isProcessing && currentFileIndex === idx ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card p-4 rounded-xl border">
              <SelectInput
                label="Conta de Cartão de Crédito para Novas Faturas *"
                value={selectedAccountForAuto}
                onChange={(e) => setSelectedAccountForAuto(e.target.value)}
                options={[
                  { label: 'Selecione o cartão...', value: '' },
                  ...creditCardAccounts.map(a => ({ label: a.name, value: a.id })),
                ]}
                disabled={isProcessing}
                required
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="mt-4 p-4 bg-primary/10 rounded-xl flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="font-medium text-primary">
              Processando arquivo {currentFileIndex + 1} de {selectedFiles.length}...
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto">
            Cancelar
          </Button>
          {selectedFiles.length > 0 && (
            <Button
              onClick={handleProceedToMapping}
              disabled={isProcessing || !selectedAccountForAuto}
              className="w-full sm:w-auto"
            >
              Continuar para Mapeamento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportFlowFaturas;