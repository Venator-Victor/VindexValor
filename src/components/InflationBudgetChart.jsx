import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCw, AlertCircle } from '@/components/BxIcon';
const Loader2 = RefreshCw;
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const CustomTooltip = ({ active, payload }) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;

    const nominalValue = payload[0]?.value;
    const correctedValue = payload[1]?.value;
    const inflationRate = data?.inflationRate ?? 0;

    const isValidNominal = typeof nominalValue === 'number' && !isNaN(nominalValue);
    const isValidCorrected = typeof correctedValue === 'number' && !isNaN(correctedValue);
    const isValidInflation = typeof inflationRate === 'number' && !isNaN(inflationRate);

    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border shadow-lg rounded-xl text-sm z-50">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize flex items-center gap-2">
          {data?.fullName || t('inflation.data_label_fallback')}
          {data?.isEstimated && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-normal">{t('inflation.estimated_badge')}</span>
          )}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('inflation.budget_nominal')}</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {isValidNominal ? formatCurrency(nominalValue) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('inflation.budget_corrected')}</span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                {isValidCorrected ? formatCurrency(correctedValue) : 'N/A'}
              </span>
            </div>
          </div>

           <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              {t('inflation.rate_this_month')} <span className="font-medium text-gray-600 dark:text-gray-300">{isValidInflation ? inflationRate.toFixed(2) : 'N/A'}%</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

const InflationBudgetChart = () => {
  const { t, i18n } = useTranslation();
  const { categories, isLoading: isFinanceLoading } = useFinance();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // 1. Calculate Base Nominal Budget (Sum of current category limits)
  const totalNominalBudget = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.budget_enabled ? Number(cat.spending_limit || 0) : 0), 0);
  }, [categories]);

  // 2. Generate Last 12 Months & Fetch Data
  useEffect(() => {
    let isMounted = true;

    const fetchHistoricalData = async () => {
      // Don't fetch until we have category data
      if (isFinanceLoading) return;
      
      setLoading(true);
      setError(null);

      const months = [];
      const now = new Date();
      
      // Generate last 12 months structure
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          name: d.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', ''),
          fullName: d.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
        });
      }

      try {
        // Calculate date range for API
        const startDateObj = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month

        const formatDate = (date) => 
          `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

        // Single request for the entire range
        const { data: responseData, error: apiError } = await supabase.functions.invoke('fetch-inflation-data', {
          body: { 
            startDate: formatDate(startDateObj),
            endDate: formatDate(endDateObj)
          }
        });

        if (apiError) throw new Error(apiError.message || t('inflation.communication_error'));
        if (responseData?.error) throw new Error(responseData.error);
        
        // Validate response format
        const inflationData = Array.isArray(responseData?.data) ? responseData.data : [];

        if (!isMounted) return;

        // Calculate cumulative inflation
        let currentCorrected = totalNominalBudget;
        
        const data = months.map((m, index) => {
          // Find matching data point
          const match = inflationData.find(item => {
            const [dDay, dMonth, dYear] = item.date.split('/');
            return parseInt(dMonth) === m.month && parseInt(dYear) === m.year;
          });
          
          // If data is unavailable, assume 0% inflation but mark as estimated
          const inflationRate = match ? match.value : 0;
          const isEstimated = !match;
          
          // Apply inflation accumulation (compound interest formula)
          // We apply inflation of the previous month to adjust current month's value, 
          // or apply current month's inflation to get end-of-month value.
          // Here we assume we want to see how much we need at the END of the month.
          if (index > 0) {
             currentCorrected = currentCorrected * (1 + (inflationRate / 100));
          }

          return {
            name: m.name,
            fullName: m.fullName,
            nominal: totalNominalBudget,
            corrected: currentCorrected,
            inflationRate,
            isEstimated
          };
        });

        setChartData(data);

      } catch (err) {
        if (isMounted) {
          setError(err.message || t('inflation.load_error_desc'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistoricalData();

    return () => {
      isMounted = false;
    };
  }, [totalNominalBudget, isFinanceLoading, retryCount, i18n.language, t]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Determine current (latest) values for the header
  const currentValues = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { nominal: totalNominalBudget, corrected: totalNominalBudget };
    }
    const lastPoint = chartData[chartData.length - 1];
    return {
      nominal: lastPoint.nominal,
      corrected: lastPoint.corrected
    };
  }, [chartData, totalNominalBudget]);

  if (error) {
    return (
      <div className="h-full min-h-[400px] w-full bg-white dark:bg-vindex-card rounded-2xl border border-gray-200 dark:border-vindex-border p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('common.error_loading')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
          {error}
        </p>
        <Button
          onClick={handleRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (loading || isFinanceLoading) {
    return (
       <div className="h-full min-h-[400px] w-full bg-white dark:bg-vindex-card rounded-2xl border border-gray-200 dark:border-vindex-border p-6 flex items-center justify-center">
         <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-400">{t('inflation.calculating')}</p>
         </div>
       </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full w-full overflow-hidden"
    >
      {/* Top Left: Nominal Budget */}
      <div className="absolute top-6 left-6 z-10 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('inflation.budget_nominal')}</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(currentValues.nominal)}
        </div>
      </div>

      {/* Top Right: Corrected Budget */}
      <div className="absolute top-6 right-6 z-10 flex flex-col items-end">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('inflation.budget_corrected')}</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(currentValues.corrected)}
        </div>
      </div>

      {/* Partial Data Warning */}
      {chartData.some(d => d.isEstimated) && (
        <div className="absolute top-20 left-6 z-20 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
            <AlertCircle className="w-3 h-3" />
            <span>{t('inflation.partial_data_warning')}</span>
        </div>
      )}

      {/* Chart Area - Padded top to avoid text overlap */}
      <div className="w-full h-full pt-16">
         <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={false}
                height={0}
              />
              <YAxis 
                yAxisId="left"
                hide={true}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '5 5', stroke: isDark ? '#525252' : '#d4d4d4' }} />
              
              <Line
                yAxisId="left"
                name={t('inflation.budget_nominal')}
                type="monotone" 
                dataKey="nominal" 
                stroke={INFO} 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6, fill: INFO, strokeWidth: 0 }}
                animationDuration={1500}
              />
              
              <Line
                yAxisId="left"
                name={t('inflation.budget_corrected')}
                type="monotone" 
                dataKey="corrected" 
                stroke={DANGER} 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6, fill: DANGER, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
         </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default InflationBudgetChart;