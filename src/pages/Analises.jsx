import React from 'react';
import { Helmet } from 'react-helmet';
import InflationSimulator from '@/components/InflationSimulator';
import InvestmentSimulator from '@/components/InvestmentSimulator';

const Analises = () => {
  return (
    <div className="space-y-8 pb-12">
      <Helmet>
        <title>VindexValor - Análises e Simulações</title>
        <meta name="description" content="Simule cenários de inflação e investimentos para planejar seu futuro financeiro." />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Análises e Simulações</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Ferramentas avançadas para projetar seu futuro financeiro e entender o impacto econômico no seu patrimônio.
        </p>
      </div>

      {/* Section 1: Inflation Simulator */}
      <section className="py-2">
        <InflationSimulator />
      </section>

      {/* Section 2: Investment Simulator */}
      <section className="py-2">
        <InvestmentSimulator />
      </section>
    </div>
  );
};

export default Analises;