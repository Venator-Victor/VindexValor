import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = user.id;
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Optimized: Use View
    const { data: investments, error } = await supabaseClient.from('vw_investment_performance').select('*').eq('user_id', userId);
    if (error) throw error;
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const byType = {};
    investments.forEach((inv)=>{
      const invested = Number(inv.invested_amount);
      const current = Number(inv.current_amount);
      const type = inv.type || 'Outros';
      totalInvested += invested;
      totalCurrentValue += current;
      if (!byType[type]) {
        byType[type] = {
          invested: 0,
          current: 0,
          return: 0
        };
      }
      byType[type].invested += invested;
      byType[type].current += current;
      byType[type].return += current - invested;
    });
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? totalReturn / totalInvested * 100 : 0;
    return new Response(JSON.stringify({
      totalInvested,
      totalCurrentValue,
      totalReturn,
      returnPercentage,
      byType
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
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
