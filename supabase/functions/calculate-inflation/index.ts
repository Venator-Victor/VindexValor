import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { budgetAmount, startPeriod, endPeriod, months, inflationRate } = await req.json();
    if (budgetAmount === undefined) {
      throw new Error("Missing parameter: budgetAmount");
    }

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
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (startPeriod && endPeriod) {
      const { data: inflationData, error } = await supabase
        .from('inflation_data')
        .select('inflation_value, period')
        .gte('period', startPeriod)
        .lte('period', endPeriod)
        .order('period', { ascending: true });
      if (error) throw error;

      let accumulatedRate = 1;
      const details = [];
      inflationData.forEach((record) => {
        const val = Number(record.inflation_value);
        accumulatedRate *= 1 + val / 100;
        details.push({ period: record.period, rate: val });
      });
      const inflatedAmount = Number(budgetAmount) * accumulatedRate;
      return new Response(JSON.stringify({
        originalAmount: Number(budgetAmount),
        inflatedAmount,
        difference: inflatedAmount - Number(budgetAmount),
        percentageChange: (accumulatedRate - 1) * 100,
        details,
        method: 'historical_data'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid parameters. Provide (budgetAmount, inflationRate, months) for simulation OR (budgetAmount, startPeriod, endPeriod) for historical calculation.");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});