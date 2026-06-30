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
    const { data: accounts, error } = await supabaseClient.from('accounts').select('id, name, type, balance').eq('user_id', userId);
    if (error) throw error;
    let totalBalance = 0;
    const byType = {};
    const byAccount = [];
    accounts.forEach((acc)=>{
      const bal = Number(acc.balance);
      totalBalance += bal;
      if (!byType[acc.type]) byType[acc.type] = 0;
      byType[acc.type] += bal;
      byAccount.push({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: bal
      });
    });
    return new Response(JSON.stringify({
      totalBalance,
      byType,
      byAccount
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
