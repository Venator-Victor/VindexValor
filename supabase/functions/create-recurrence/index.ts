import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";

function advanceDate(dateStr: string, frequency: string, steps = 1): string {
  const d = new Date(dateStr + 'T12:00:00');
  for (let i = 0; i < steps; i++) {
    switch (frequency) {
      case 'Diário':     d.setDate(d.getDate() + 1); break;
      case 'Semanal':    d.setDate(d.getDate() + 7); break;
      case 'Quinzenal':  d.setDate(d.getDate() + 15); break;
      case 'Mensal':     d.setMonth(d.getMonth() + 1); break;
      case 'Trimestral': d.setMonth(d.getMonth() + 3); break;
      case 'Semestral':  d.setMonth(d.getMonth() + 6); break;
      case 'Anual':      d.setFullYear(d.getFullYear() + 1); break;
    }
  }
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Auth Header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();

    if (body.user_id && body.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: Cannot create recurrence for another user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const targetUserId = user.id;
    const statusStr = typeof body.status === 'boolean'
      ? (body.status ? 'Ativo' : 'Inativo')
      : (body.status || 'Ativo');

    const { data: recurrence, error: recError } = await supabase
      .from('recurring_items')
      .insert({
        user_id: targetUserId,
        description: body.description,
        amount: body.amount,
        frequency: body.frequency,
        next_date: body.start_date,
        status: statusStr,
        category_id: body.category_id || null,
        recurrence_type: body.recurrence_type || 'Assinatura',
        installment_count: body.installment_count || null
      })
      .select()
      .single();

    if (recError) throw recError;

    const today = new Date().toISOString().slice(0, 10);
    let firstTransaction = null;

    if (body.start_date <= today) {
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: targetUserId,
          description: body.description,
          amount: body.amount,
          type: body.amount < 0 ? 'saida' : 'entrada',
          date: body.start_date,
          category_id: body.category_id || null,
          is_recurring: true,
          recurring_id: recurrence.id,
          original_amount: Math.abs(body.amount)
        })
        .select()
        .single();

      if (!txError) {
        firstTransaction = tx;
        recurrence.next_date = advanceDate(body.start_date, body.frequency);
        await supabase
          .from('recurring_items')
          .update({ next_date: recurrence.next_date })
          .eq('id', recurrence.id)
          .eq('user_id', targetUserId);
      }
    }

    // Create installments upfront for Parcelas type
    if (body.recurrence_type === 'Parcelas' && body.installment_count && body.installment_count > 0) {
      const count = parseInt(body.installment_count);
      const installments = [];
      for (let i = 0; i < count; i++) {
        const isPaid = i === 0 && firstTransaction !== null;
        installments.push({
          user_id: targetUserId,
          recurring_item_id: recurrence.id,
          parcel_number: i + 1,
          amount: Math.abs(body.amount),
          due_date: advanceDate(body.start_date, body.frequency, i),
          status: isPaid ? 'paid' : 'pending',
          paid_date: isPaid ? body.start_date : null
        });
      }
      await supabase.from('recurring_installments').insert(installments);
    }

    return new Response(JSON.stringify({ success: true, recurrence, firstTransaction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});