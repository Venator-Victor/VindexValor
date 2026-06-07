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
    const { month, year } = await req.json();
    if (!month || !year) {
      throw new Error("Missing parameters: month, year");
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
