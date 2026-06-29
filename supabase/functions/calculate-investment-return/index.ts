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

    const { investedAmount, currentAmount } = await req.json();
    if (investedAmount === undefined || currentAmount === undefined) {
      throw new Error("Missing required parameters: investedAmount, currentAmount");
    }

    const initial = Number(investedAmount);
    const current = Number(currentAmount);

    if (initial === 0) {
      return new Response(JSON.stringify({
        returnAmount: current,
        returnPercentage: 0,
        isPositive: current >= 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const returnAmount = current - initial;
    const returnPercentage = returnAmount / initial * 100;
    return new Response(JSON.stringify({
      returnAmount,
      returnPercentage,
      isPositive: returnAmount >= 0
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});