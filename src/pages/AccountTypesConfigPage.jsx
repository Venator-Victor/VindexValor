import React from 'react';
import { Helmet } from 'react-helmet';
import { Settings, Info } from 'lucide-react';
import { ACCOUNT_SUBTYPE_MAP } from '@/utils/accountMappings';

const AccountTypesConfigPage = () => {
  const accountTypes = Object.entries(ACCOUNT_SUBTYPE_MAP).map(([typeName, subtypeCode]) => {
    let description = '';
    
    switch(subtypeCode) {
      case 'credit_card':
        description = 'Conta usada para gerenciar gastos em cartão de crédito, faturas e limites.';
        break;
      case 'checking':
        description = 'Conta corrente padrão para movimentações diárias, pagamentos e recebimentos.';
        break;
      case 'savings':
        description = 'Conta poupança para guardar dinheiro a longo prazo com baixo risco.';
        break;
      case 'investment':
        description = 'Conta destinada a gerenciar seus investimentos em corretoras.';
        break;
      case 'crypto':
        description = 'Conta para ativos digitais e criptomoedas (ex: BTC, ETH).';
        break;
      case 'cash':
        description = 'Carteira física ou dinheiro em espécie.';
        break;
      default:
        description = 'Outros tipos de contas financeiras não categorizadas acima.';
    }

    return { typeName, subtypeCode, description };
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Configurações de Tipos de Conta - VindexValor</title>
      </Helmet>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mapeamento de Tipos de Conta</h1>
          <p className="text-muted-foreground">Consulte a relação entre os tipos de conta e seus subtipos no sistema.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-muted/50 rounded-lg text-sm">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            O subtipo de conta (<strong>account_subtype</strong>) é usado internamente para aplicar regras específicas, como esconder o campo de "Saldo Inicial" e exibir "Limite do Cartão" para contas do tipo <em>Cartão de Crédito</em>.
          </p>
        </div>

        <div className="overflow-x-auto custom-scrollbar border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-medium w-1/4">Tipo de Conta (Visível)</th>
                <th className="p-4 font-medium w-1/4">Código do Subtipo</th>
                <th className="p-4 font-medium w-1/2">Descrição / Comportamento</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accountTypes.map((item, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold">{item.typeName}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono text-xs">
                      {item.subtypeCode}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountTypesConfigPage;