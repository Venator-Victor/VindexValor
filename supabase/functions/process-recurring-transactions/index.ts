import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
      return new Response(JSON.stringify({
        error: 'Unauthorized: Missing Auth Header'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseToken = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseToken}`
        }
      }
    });
    // Validate the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Invalid token'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const body = await req.json().catch(()=>({}));
    const targetUserId = body.userId || user.id;
    // Strict validation: Users can only process their own recurrences
    if (targetUserId !== user.id) {
      return new Response(JSON.stringify({
        error: 'Forbidden: Cannot process for another user'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    const { data: recurrences, error: fetchError } = await supabase.from('recorrencias').select('*').eq('status', true).eq('user_id', user.id).lte('next_date', today);
    if (fetchError) throw fetchError;
    let processedCount = 0;
    for (const rec of recurrences || []){
      const { error: txError } = await supabase.from('transacoes').insert({
        user_id: user.id,
        description: rec.description,
        amount: rec.amount,
        type: rec.amount < 0 ? 'saida' : 'entrada',
        date: rec.next_date,
        categoria_id: rec.categoria_id,
        is_recurring: true,
        recurring_id: rec.id,
        original_amount: rec.amount
      });
      if (!txError) {
        const nextDate = new Date(rec.next_date);
        switch(rec.frequency){
          case 'Semanal':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'Quinzenal':
            nextDate.setDate(nextDate.getDate() + 15);
            break;
          case 'Mensal':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'Trimestral':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'Semestral':
            nextDate.setMonth(nextDate.getMonth() + 6);
            break;
          case 'Anual':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }
        await supabase.from('recorrencias').update({
          next_date: nextDate.toISOString().slice(0, 10)
        }).eq('id', rec.id).eq('user_id', user.id);
        processedCount++;
      }
    }
    return new Response(JSON.stringify({
      success: true,
      processedCount
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
