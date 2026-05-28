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
    const { data: accounts, error } = await supabaseClient.from('contas').select('id, name, type, balance').eq('user_id', userId);
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
