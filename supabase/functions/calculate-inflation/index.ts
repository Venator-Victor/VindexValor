import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "./cors.ts";
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { budgetAmount, startPeriod, endPeriod, months, inflationRate } = await req.json();
    if (budgetAmount === undefined) {
      throw new Error("Missing parameter: budgetAmount");
    }
    // If explicit rate provided, use formula (Backward compatibility / Simulator mode)
    if (inflationRate !== undefined && months !== undefined) {
      const rate = Number(inflationRate);
      const m = Number(months);
      const inflatedAmount = Number(budgetAmount) * Math.pow(1 + rate, m);
      return new Response(JSON.stringify({
        originalAmount: Number(budgetAmount),
        inflatedAmount,
        difference: inflatedAmount - Number(budgetAmount),
        percentageChange: (inflatedAmount - Number(budgetAmount)) / Number(budgetAmount) * 100,
        method: 'simulated_rate'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Real Data Mode: Using period range (e.g., '2023-01' to '2023-12')
    if (startPeriod && endPeriod) {
      // Query database
      const { data: inflationData, error } = await supabaseClient.from('inflation_data').select('inflation_value, period').gte('period', startPeriod).lte('period', endPeriod).order('period', {
        ascending: true
      });
      if (error) throw error;
      // If data missing, try to fetch (Self-healing)
      // Check if start and end exist. If result is empty or partial, trigger fetch?
      // For simplicity, if empty, we might return error or attempt fetch. 
      // Let's assume database is populated via cron/fetch-inflation-data.
      let accumulatedRate = 1;
      let details = [];
      inflationData.forEach((record)=>{
        // value is usually percentage like 0.53 (meaning 0.53%). 
        // Formula: Acc = Acc * (1 + val/100)
        const val = Number(record.inflation_value);
        accumulatedRate *= 1 + val / 100;
        details.push({
          period: record.period,
          rate: val
        });
      });
      const inflatedAmount = Number(budgetAmount) * accumulatedRate;
      return new Response(JSON.stringify({
        originalAmount: Number(budgetAmount),
        inflatedAmount,
        difference: inflatedAmount - Number(budgetAmount),
        percentageChange: (accumulatedRate - 1) * 100,
        details,
        method: 'historical_data'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    throw new Error("Invalid parameters. Provide (budgetAmount, inflationRate, months) for simulation OR (budgetAmount, startPeriod, endPeriod) for historical calculation.");
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
