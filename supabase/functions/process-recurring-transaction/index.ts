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

    const { recurringId } = await req.json();
    if (!recurringId) throw new Error("Missing parameters");

    const { data: rule, error: fetchError } = await supabaseClient
      .from('recurring_items')
      .select('*')
      .eq('id', recurringId)
      .eq('user_id', userId)
      .single();
    if (fetchError || !rule) throw new Error("Recurrence not found");

    const { data: txData, error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        description: rule.description,
        amount: rule.amount,
        type: Number(rule.amount) < 0 ? 'saida' : 'entrada',
        date: rule.next_date,
        category_id: rule.category_id,
        is_recurring: true,
        recurring_id: rule.id,
        original_amount: Math.abs(Number(rule.amount)),
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (txError) throw txError;

    const nextDate = new Date(rule.next_date + 'T12:00:00');
    switch (rule.frequency) {
      case 'Diário':     nextDate.setDate(nextDate.getDate() + 1); break;
      case 'Semanal':    nextDate.setDate(nextDate.getDate() + 7); break;
      case 'Quinzenal':  nextDate.setDate(nextDate.getDate() + 15); break;
      case 'Mensal':     nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'Trimestral': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'Semestral':  nextDate.setMonth(nextDate.getMonth() + 6); break;
      case 'Anual':      nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      default:           nextDate.setMonth(nextDate.getMonth() + 1);
    }
    const nextDateStr = nextDate.toISOString().slice(0, 10);

    const { error: updateError } = await supabaseClient
      .from('recurring_items')
      .update({ next_date: nextDateStr })
      .eq('id', rule.id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, transactionId: txData.id, nextDate: nextDateStr, transaction: txData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});