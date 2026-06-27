import { DANGER_DARK } from '@/utils/colors';
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { InfoCircle as Info, AlertCircle, RefreshCw, TrendingDown } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
const Loader2 = RefreshCw;
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FIRST_YEAR = 1995;
const CURRENT_YEAR = new Date().getFullYear();

const PERIOD_OPTIONS = [
  { label: '3 meses', months: 3 },
  { label: '6 meses', months: 6 },
  { label: '1 ano', months: 12 },
  { label: '2 anos', months: 24 },
  { label: '5 anos', months: 60 },
  { label: '10 anos', months: 120 },
  { label: '20 anos', months: 240 },
];

const ALL_YEARS = Array.from(
  { length: CURRENT_YEAR - FIRST_YEAR + 1 },
  (_, i) => String(FIRST_YEAR + i)
);

const InflationCard = ({ currentBalance }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // 'period' | 'range' | 'all'
  const [mode, setMode] = useState('period');
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [rangeStart, setRangeStart] = useState(String(CURRENT_YEAR - 5));
  const [rangeEnd, setRangeEnd] = useState(String(CURRENT_YEAR));

  const textColor = isDark ? "#d1dcf0" : "#1f2937";
  const gridColor = isDark ? "#283768" : "#e5e7eb";
  const tooltipBg = isDark ? "#161e3b" : "#ffffff";
  const tooltipBorder = isDark ? "#283768" : "#e2e8f0";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if we already have historical data going back to 1995
        const { data: probe } = await supabase
          .from('inflation_data')
          .select('period')
          .lte('period', '1995-03')
          .limit(1);

        if (!probe?.length) {
          // Backfill from BCB: Jan 1995 → today (best-effort; non-fatal if function unavailable)
          setSyncing(true);
          try {
            const { data: syncResult, error: syncError } = await supabase.functions.invoke(
              'fetch-inflation-data',
              { body: { syncAll: true } }
            );
            if (syncError) console.warn('Inflation backfill skipped:', syncError.message);
            else if (syncResult?.error) console.warn('Inflation backfill error:', syncResult.error);
          } catch (e) {
            console.warn('Inflation backfill exception:', e);
          } finally {
            setSyncing(false);
          }
        }

        const { data, error: dbError } = await supabase
          .from('inflation_data')
          .select('period, inflation_value')
          .gte('period', `${FIRST_YEAR}-01`)
          .order('period', { ascending: true });

        if (dbError) throw dbError;
        setAllData(data ?? []);
      } catch (err) {
        console.error("Error loading inflation data:", err);
        setError(err.message || "Não foi possível carregar os dados de inflação.");
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    };

    loadData();
  }, []);

  const filteredData = useMemo(() => {
    if (!allData.length) return [];
    if (mode === 'all') return allData;
    if (mode === 'period') return allData.slice(-selectedMonths);
    // range
    return allData.filter(
      r => r.period >= `${rangeStart}-01` && r.period <= `${rangeEnd}-12`
    );
  }, [allData, mode, selectedMonths, rangeStart, rangeEnd]);

  const { chartData, totalCumulative } = useMemo(() => {
    if (!filteredData.length) return { chartData: [], totalCumulative: 0 };

    const compounds = filteredData.reduce(
      (acc, item) => acc.concat(acc[acc.length - 1] * (1 + Number(item.inflation_value) / 100)),
      [1]
    ).slice(1);

    const data = filteredData.map((item, i) => {
      const [year, month] = item.period.split('-');
      return {
        name: `${month}/${year}`,
        cumulative: parseFloat(((compounds[i] - 1) * 100).toFixed(2)),
      };
    });

    return {
      chartData: data,
      totalCumulative: data.length ? data[data.length - 1].cumulative : 0,
    };
  }, [filteredData]);

  const isLongPeriod = chartData.length > 36;
  const xAxisTickFormatter = (value) =>
    isLongPeriod ? (value.startsWith('01/') ? value.substring(3) : '') : value;
  const xAxisInterval = isLongPeriod ? 11 : 'preserveStartEnd';

  const periodStartYear = filteredData.length
    ? filteredData[0].period.substring(0, 4)
    : String(FIRST_YEAR);

  const modeButtonClass = (m) =>
    `px-3 py-1 text-sm rounded-md transition-colors ${
      mode === m
        ? 'bg-vindex-danger text-white font-medium'
        : 'text-gray-500 dark:text-vindex-text/60 hover:text-gray-800 dark:hover:text-vindex-text'
    }`;

  if (error) {
    return (
      <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-red-200 dark:border-vindex-danger/30 shadow-lg flex flex-col items-center justify-center h-[300px]">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-gray-900 dark:text-white font-medium mb-2">Erro ao carregar dados</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-red-200 dark:border-vindex-danger/30 shadow-lg relative overflow-hidden group transition-colors duration-300"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
        <TrendingDown size={144} className="text-vindex-danger" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-vindex-text flex items-center gap-2">
          <TrendingDown size={20} className="text-vindex-danger" />
          Impacto Histórico da Inflação (IPCA)
          <UiTooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-500 dark:text-vindex-text/50" />
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border">
              <p className="text-gray-900 dark:text-vindex-text">Inflação acumulada (IPCA/BCB) no período selecionado, calculada pelo método composto.</p>
            </TooltipContent>
          </UiTooltip>
        </h2>

        {/* Mode toggle + controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Mode buttons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-vindex-bg rounded-lg p-1">
            <button className={modeButtonClass('period')} onClick={() => setMode('period')}>Período</button>
            <button className={modeButtonClass('range')} onClick={() => setMode('range')}>Intervalo</button>
            <button className={modeButtonClass('all')} onClick={() => setMode('all')}>Tudo</button>
          </div>

          {/* Controls per mode */}
          {mode === 'period' && (
            <select
              value={selectedMonths}
              onChange={(e) => setSelectedMonths(Number(e.target.value))}
              className="bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-vindex-danger"
            >
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.months} value={opt.months}>Últimos {opt.label}</option>
              ))}
            </select>
          )}

          {mode === 'range' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-vindex-text/60">De</span>
              <select
                value={rangeStart}
                onChange={(e) => {
                  setRangeStart(e.target.value);
                  if (e.target.value > rangeEnd) setRangeEnd(e.target.value);
                }}
                className="bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-vindex-danger"
              >
                {ALL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-sm text-gray-500 dark:text-vindex-text/60">até</span>
              <select
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-vindex-danger"
              >
                {ALL_YEARS.filter(y => y >= rangeStart).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'all' && (
            <span className="text-xs text-gray-400 dark:text-vindex-text/40">
              {FIRST_YEAR} – {CURRENT_YEAR}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-vindex-danger" />
          {syncing && (
            <p className="text-sm text-gray-400 dark:text-vindex-text/50">
              Sincronizando dados históricos do BCB…
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DANGER_DARK} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={DANGER_DARK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={xAxisInterval}
                  tickFormatter={xAxisTickFormatter}
                />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }}
                  itemStyle={{ color: textColor }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Inflação Acumulada']}
                />
                <Area type="monotone" dataKey="cumulative" stroke={DANGER_DARK} fillOpacity={1} fill="url(#colorInflation)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center space-y-4 bg-gray-50 dark:bg-vindex-bg/30 p-4 rounded-lg border border-gray-200 dark:border-vindex-border/30">
            <div>
              <p className="text-sm text-gray-500 dark:text-vindex-text/70">Inflação no Período</p>
              <p className="text-2xl font-bold text-vindex-danger">+{totalCumulative.toFixed(2)}%</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-vindex-text/70">Perda de Poder de Compra</p>
              <p className="text-sm text-gray-400 dark:text-vindex-text/50 mb-1">Para cada R$ 1.000,00</p>
              <p className="text-xl font-bold text-gray-900 dark:text-vindex-text">
                Hoje vale:{' '}
                <span className="text-vindex-danger">
                  {formatCurrency(1000 / (1 + totalCumulative / 100))}
                </span>
              </p>
            </div>

            <div className="text-xs text-gray-400 dark:text-vindex-text/50">
              Você precisa de {((1 + totalCumulative / 100) * 100).toFixed(0)}% do valor de {periodStartYear} para comprar as mesmas coisas hoje.
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InflationCard;