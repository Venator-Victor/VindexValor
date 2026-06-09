import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useFinance } from '@/context/FinanceContext';
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

const InflationCard = ({ currentBalance }) => {
  const [period, setPeriod] = useState('12'); // months
  const { inflationHistory: contextHistory } = useFinance();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [localHistory, setLocalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const textColor = isDark ? "#d1dcf0" : "#1f2937";
  const gridColor = isDark ? "#283768" : "#e5e7eb";
  const tooltipBg = isDark ? "#161e3b" : "#ffffff";
  const tooltipBorder = isDark ? "#283768" : "#e2e8f0";

  // Fetch data if context is empty or we need a specific range not in context
  useEffect(() => {
    const fetchInflationData = async () => {
      // If we have context data, use it initially, but we might want to ensure we have enough data
      if (contextHistory && contextHistory.length > 0) {
        setLocalHistory(contextHistory);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Calculate date range for "all" or max period (e.g., 2 years)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 24); // Fetch last 24 months by default

        const formatDate = (date) => {
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        };

        const { data, error: funcError } = await supabase.functions.invoke('fetch-inflation-data', {
          body: { 
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
          }
        });

        if (funcError) throw new Error(funcError.message || "Failed to invoke function");
        if (data?.error) throw new Error(data.error);

        // Validate response format
        const rawData = Array.isArray(data?.data) ? data.data : [];
        
        if (rawData.length === 0) {
           // Fallback or empty state if no data returned
           console.warn("No inflation data returned from API");
        }

        // Process raw data into cumulative history
        // Data comes as [{ date: "DD/MM/YYYY", value: 0.53 }]
        // We need to sort and calculate cumulative
        const sortedData = rawData.sort((a, b) => {
          const [da, ma, ya] = a.date.split('/').map(Number);
          const [db, mb, yb] = b.date.split('/').map(Number);
          return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        });

        let cumulative = 0;
        const processedHistory = sortedData.map(item => {
          cumulative += item.value;
          return {
            date: item.date.substring(3), // MM/YYYY
            value: item.value,
            cumulative: cumulative
          };
        });

        setLocalHistory(processedHistory);

      } catch (err) {
        console.error("Error fetching inflation data:", err);
        setError("Não foi possível carregar os dados de inflação.");
      } finally {
        setLoading(false);
      }
    };

    fetchInflationData();
  }, [contextHistory]);

  const filteredHistory = useMemo(() => {
    const sourceData = localHistory.length > 0 ? localHistory : [];
    if (period === 'all') return sourceData;
    const months = parseInt(period);
    return sourceData.slice(-months);
  }, [period, localHistory]);

  const chartData = useMemo(() => {
    const baseAmount = 1000;
    
    return filteredHistory.map(item => ({
      name: item.date,
      inflation: item.cumulative,
      purchasingPower: baseAmount / (1 + item.cumulative / 100)
    }));
  }, [filteredHistory]);

  const totalInflationInPeriod = filteredHistory.length > 0 
    ? filteredHistory[filteredHistory.length - 1].cumulative - filteredHistory[0].cumulative 
    : 0;

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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-vindex-text flex items-center gap-2">
          <TrendingDown size={20} className="text-vindex-danger" />
          Impacto Histórico da Inflação
          <UiTooltip>
             <TooltipTrigger>
               <Info className="w-4 h-4 text-gray-500 dark:text-vindex-text/50" />
             </TooltipTrigger>
             <TooltipContent className="bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border">
               <p className="text-gray-900 dark:text-vindex-text">Mostra como a inflação acumulada corroeu o poder de compra no período selecionado.</p>
             </TooltipContent>
           </UiTooltip>
        </h2>
        
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-vindex-success"
        >
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Último ano</option>
          <option value="24">Últimos 2 anos</option>
          <option value="all">Todo o período</option>
        </select>
      </div>

      {loading && localHistory.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-vindex-danger" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2 h-64">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={DANGER_DARK} stopOpacity={0.8}/>
                     <stop offset="95%" stopColor={DANGER_DARK} stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                 <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} unit="%" />
                 <Tooltip 
                   contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }}
                   itemStyle={{ color: textColor }}
                   formatter={(value) => [`${value.toFixed(2)}%`, 'Inflação Acumulada']}
                 />
                 <Area type="monotone" dataKey="inflation" stroke={DANGER_DARK} fillOpacity={1} fill="url(#colorInflation)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center space-y-4 bg-gray-50 dark:bg-vindex-bg/30 p-4 rounded-lg border border-gray-200 dark:border-vindex-border/30">
            <div>
              <p className="text-sm text-gray-500 dark:text-vindex-text/70">Inflação no Período</p>
              <p className="text-2xl font-bold text-vindex-danger">+{totalInflationInPeriod.toFixed(2)}%</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-vindex-text/70">Perda de Poder de Compra</p>
              <p className="text-sm text-gray-400 dark:text-vindex-text/50 mb-1">Para cada R$ 1.000,00</p>
              <p className="text-xl font-bold text-gray-900 dark:text-vindex-text">
                 Hoje vale: <span className="text-vindex-danger">{formatCurrency(1000 / (1 + totalInflationInPeriod/100))}</span>
              </p>
            </div>

            <div className="text-xs text-gray-400 dark:text-vindex-text/50 mt-2">
              Isso significa que você precisa de {((1 + totalInflationInPeriod/100) * 100).toFixed(0)}% do valor original para comprar as mesmas coisas.
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InflationCard;