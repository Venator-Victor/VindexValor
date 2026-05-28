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
    const { userId, month, year } = await req.json();
    if (!userId || !month || !year) {
      throw new Error("Missing parameters: userId, month, year");
    }
    // Optimized: Use Views
    // We need 2 things: Totals (from vw_income_vs_expense_monthly) and Category Breakdown (from vw_expense_by_category_monthly)
    const [summaryResult, categoryResult] = await Promise.all([
      supabaseClient.from('vw_income_vs_expense_monthly').select('*').eq('user_id', userId).eq('month', month).eq('year', year).maybeSingle(),
      supabaseClient.from('vw_expense_by_category_monthly').select('*').eq('user_id', userId).eq('month', month).eq('year', year)
    ]);
    if (summaryResult.error) throw summaryResult.error;
    if (categoryResult.error) throw categoryResult.error;
    const summary = summaryResult.data || {
      total_income: 0,
      total_expense: 0,
      net_balance: 0
    };
    const byCategory = {};
    (categoryResult.data || []).forEach((cat)=>{
      byCategory[cat.category_name] = Number(cat.total_amount);
    });
    return new Response(JSON.stringify({
      totalIncome: Number(summary.total_income),
      totalExpense: Number(summary.total_expense),
      netBalance: Number(summary.net_balance),
      byCategory
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
