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
    const body = await req.json();
    // Explicit Authorization Enforcement
    if (body.user_id && body.user_id !== user.id) {
      return new Response(JSON.stringify({
        error: 'Forbidden: Cannot create recurrence for another user'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const targetUserId = user.id;
    const { data: recurrence, error: recError } = await supabase.from('recorrencias').insert({
      user_id: targetUserId,
      description: body.description,
      amount: body.amount,
      frequency: body.frequency,
      next_date: body.start_date,
      status: body.status,
      category_id: body.category_id,
      recurrence_type: body.recurrence_type || 'Assinatura',
      installment_count: body.installment_count
    }).select().single();
    if (recError) throw recError;
    const today = new Date().toISOString().slice(0, 10);
    let firstTransaction = null;
    if (body.start_date <= today) {
      const { data: tx, error: txError } = await supabase.from('transacoes').insert({
        user_id: targetUserId,
        description: body.description,
        amount: body.amount,
        type: body.amount < 0 ? 'saida' : 'entrada',
        date: body.start_date,
        category_id: body.category_id,
        is_recurring: true,
        recurring_id: recurrence.id,
        original_amount: body.amount
      }).select().single();
      if (!txError) {
        firstTransaction = tx;
        const nextDate = new Date(body.start_date);
        switch(body.frequency){
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
        }).eq('id', recurrence.id).eq('user_id', targetUserId);
        recurrence.next_date = nextDate.toISOString().slice(0, 10);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      recurrence,
      firstTransaction
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
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
