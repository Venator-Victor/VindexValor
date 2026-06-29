import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";
import { advanceDate } from "../_shared/date-utils.ts";

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const userId = user.id;

    // Full-transaction path: frontend sends body.transaction with all fields.
    // This is the atomic path — recurring_item + transaction + installments in one call.
    if (body.transaction) {
      const tx = body.transaction;
      const recurrenceType = body.recurrence_type || tx.recurring_type || 'Assinatura';
      const frequency = body.frequency || tx.frequency;
      const installmentCount = body.installment_count ? parseInt(body.installment_count) : null;

      // 1. Create recurring_item
      const { data: recurrence, error: recError } = await supabase
        .from('recurring_items')
        .insert({
          user_id: userId,
          description: tx.description,
          amount: tx.amount,
          frequency,
          next_date: advanceDate(tx.date, frequency),
          status: 'Ativo',
          category_id: tx.category_id || null,
          recurrence_type: recurrenceType,
          installment_count: installmentCount,
        })
        .select()
        .single();

      if (recError) throw recError;

      // 2. Create transaction with all client-supplied fields + recurring_id.
      // user_id is always overwritten with the authenticated user — never trust body.transaction.user_id.
      const { data: firstTransaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          account_id: tx.account_id || null,
          destination_account_id: tx.destination_account_id || null,
          category_id: tx.category_id || null,
          invoice_id: tx.invoice_id || null,
          notes: tx.notes || null,
          original_amount: tx.original_amount ?? Math.abs(Number(tx.amount)),
          converted_amount: tx.converted_amount ?? null,
          is_recurring: true,
          recurring_id: recurrence.id,
          recurring_type: recurrenceType,
        })
        .select()
        .single();

      if (txError) throw txError;

      // 3. Create installments for Parcelas type
      if (recurrenceType === 'Parcelas' && installmentCount && installmentCount > 0) {
        const installments = Array.from({ length: installmentCount }, (_, i) => ({
          user_id: userId,
          recurring_item_id: recurrence.id,
          parcel_number: i + 1,
          amount: Math.abs(Number(tx.amount)),
          due_date: advanceDate(tx.date, frequency, i),
          status: i === 0 ? 'paid' : 'pending',
          paid_date: i === 0 ? tx.date : null,
        }));
        const { error: instError } = await supabase.from('recurring_installments').insert(installments);
        if (instError) throw instError;
      }

      return new Response(JSON.stringify({ success: true, recurrence, firstTransaction }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Legacy path: called without a transaction object (e.g. scheduling a future recurrence).
    if (body.user_id && body.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden: Cannot create recurrence for another user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const statusStr = typeof body.status === 'boolean'
      ? (body.status ? 'Ativo' : 'Inativo')
      : (body.status || 'Ativo');

    const { data: recurrence, error: recError } = await supabase
      .from('recurring_items')
      .insert({
        user_id: userId,
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
          user_id: userId,
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
          .eq('user_id', userId);
      }
    }

    if (body.recurrence_type === 'Parcelas' && body.installment_count && body.installment_count > 0) {
      const count = parseInt(body.installment_count);
      const installments = [];
      for (let i = 0; i < count; i++) {
        const isPaid = i === 0 && firstTransaction !== null;
        installments.push({
          user_id: userId,
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