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
    const { months = 12 } = await req.json();
    // 1. Get Current Accounts Snapshot
    const { data: accounts, error: accError } = await supabaseClient.from('accounts').select('id, type, balance').eq('user_id', userId);
    if (accError) throw accError;
    const LIABILITY_TYPES = [
      'Cartão de Crédito',
      'Empréstimos',
      'Financiamento'
    ];
    const accountMap = {};
    let currentAssets = 0;
    let currentLiabilities = 0;
    accounts.forEach((acc)=>{
      const bal = Number(acc.balance);
      accountMap[acc.id] = {
        type: acc.type
      };
      if (LIABILITY_TYPES.includes(acc.type)) {
        currentLiabilities += Math.abs(bal);
      } else {
        currentAssets += bal;
      }
    });
    // 2. Fetch Monthly Flow History from View (Optimized)
    // We only need flows for the requested months range
    const now = new Date();
    const startYear = now.getFullYear() - months / 12 - 1; // Buffer
    const { data: flows, error: flowError } = await supabaseClient.from('vw_account_monthly_flow').select('*').eq('user_id', userId).gte('year', startYear);
    if (flowError) throw flowError;
    // 3. Reconstruct History
    const history = [];
    let runningAssets = currentAssets;
    let runningLiabilities = currentLiabilities;
    // Helper to match flow data
    const getFlowForMonth = (y, m, accountId)=>{
      const flow = flows.find((f)=>f.year === y && f.month === m && f.account_id === accountId);
      return flow ? Number(flow.net_flow) : 0;
    };
    // Iterate backwards
    for(let i = 0; i < months; i++){
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-12
      history.unshift({
        date: d.toISOString().slice(0, 7),
        assets: runningAssets,
        liabilities: runningLiabilities,
        netWorth: runningAssets - runningLiabilities
      });
      // Undo this month's flows to get start-of-month (or end-of-prev) state
      // Prev_Balance = Curr_Balance - Flow
      accounts.forEach((acc)=>{
        const flow = getFlowForMonth(y, m, acc.id);
        if (flow !== 0) {
          if (LIABILITY_TYPES.includes(acc.type)) {
            // Liability magnitude logic
            // If flow was -20 (expense), debt increased.
            // runningLiab (magnitude) should decrease by 20 to go back.
            // flow is signed (-20).
            // Mag_prev = Mag_curr + flow? 
            // Example: Debt 100. Flow -20 (Expense). Prev Debt was 80.
            // 100 + (-20) = 80. Correct.
            runningLiabilities += flow;
          } else {
            // Asset
            // Asset 100. Flow -20 (Expense). Prev Asset was 120.
            // 100 - (-20) = 120. Correct.
            runningAssets -= flow;
          }
        }
      });
      runningAssets = Math.max(0, runningAssets);
      runningLiabilities = Math.max(0, runningLiabilities);
    }
    return new Response(JSON.stringify(history), {
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
