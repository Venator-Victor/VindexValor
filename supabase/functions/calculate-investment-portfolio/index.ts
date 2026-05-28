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
    const { userId } = await req.json();
    if (!userId) throw new Error("Missing userId");
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
