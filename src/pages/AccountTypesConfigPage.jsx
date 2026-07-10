import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Cog as Settings, InfoCircle as Info } from '@/components/BxIcon';
import { ACCOUNT_SUBTYPE_MAP, ACCOUNT_TYPE_LABEL_KEYS } from '@/utils/accountMappings';

const AccountTypesConfigPage = () => {
  const { t } = useTranslation();
  const accountTypes = Object.entries(ACCOUNT_SUBTYPE_MAP).map(([typeName, subtypeCode]) => {
    let description = '';

    switch(subtypeCode) {
      case 'credit_card':
        description = t('account_types.credit_card_desc');
        break;
      case 'checking':
        description = t('account_types.checking_desc');
        break;
      case 'savings':
        description = t('account_types.savings_desc');
        break;
      case 'investment':
        description = t('account_types.investment_desc');
        break;
      case 'crypto':
        description = t('account_types.crypto_desc');
        break;
      case 'cash':
        description = t('account_types.cash_desc');
        break;
      default:
        description = t('account_types.other_desc');
    }

    const label = t(ACCOUNT_TYPE_LABEL_KEYS[typeName] || typeName);
    return { typeName, label, subtypeCode, description };
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('account_types.title')} - VindexValor</title>
      </Helmet>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('account_types.title')}</h1>
          <p className="text-muted-foreground">{t('account_types.subtitle')}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-muted/50 rounded-lg text-sm">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            {t('account_types.info_text')}
          </p>
        </div>

        <div className="overflow-x-auto custom-scrollbar border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-medium w-1/4">{t('account_types.col_type')}</th>
                <th className="p-4 font-medium w-1/4">{t('account_types.col_subtype')}</th>
                <th className="p-4 font-medium w-1/2">{t('account_types.col_description')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accountTypes.map((item, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold">{item.label}</td>
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