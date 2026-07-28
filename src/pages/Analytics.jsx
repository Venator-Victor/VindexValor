import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import InflationSimulator from '@/components/InflationSimulator';
import InvestmentSimulator from '@/components/InvestmentSimulator';
import InflationCard from '@/components/InflationCard';
import M2VsInflationChart from '@/components/M2VsInflationChart';

const Analytics = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-12">
      <Helmet>
        <title>VindexValor - {t('analytics.title')}</title>
        <meta name="description" content={t('analytics.subtitle')} />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('analytics.title')}</h1>
        <p className="text-gray-700 dark:text-gray-300">{t('analytics.subtitle')}</p>
      </div>

      <section className="py-2">
        <InflationCard />
      </section>

      <section className="py-2">
        <M2VsInflationChart />
      </section>

      <section className="py-2">
        <InflationSimulator />
      </section>

      <section className="py-2">
        <InvestmentSimulator />
      </section>
    </div>
  );
};

export default Analytics;