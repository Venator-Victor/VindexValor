import React from 'react';
import { Share as UploadCloud } from '@/components/BxIcon';
const CSVImportModal = ({ onFileSelected, isParsing, error }) => {
  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-vindex-border rounded-xl p-8 text-center flex flex-col items-center justify-center bg-gray-50 dark:bg-vindex-bg/50">
      <UploadCloud className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Selecione o arquivo CSV
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
        O arquivo precisa conter as seguintes colunas obrigatórias: <br/>
        <span className="font-semibold text-gray-700 dark:text-gray-300">Data, Valor, Identificador, Descrição</span>
      </p>
      
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileSelected(e.target.files[0]);
            }
          }}
          disabled={isParsing}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-gray-900 hover:file:bg-primary/85 cursor-pointer transition-colors"
        />
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}
      
      {isParsing && (
        <p className="mt-4 text-primary font-medium text-sm animate-pulse">
          Processando arquivo CSV...
        </p>
      )}
    </div>
  );
};

export default CSVImportModal;