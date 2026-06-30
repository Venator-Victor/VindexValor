import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ valid: false, errors: ['Unauthorized'] }), {
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
      return new Response(JSON.stringify({ valid: false, errors: ['Unauthorized'] }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await req.json();
    const { type, recurring, recurringType, amount, account_id, destination_account_id } = data;
    const errors = [];

    if (type === 'transferencia' && recurring === true) {
      errors.push("Transfers cannot be recurring.");
    }
    if (recurring === true && type === 'entrada' && recurringType !== 'salário') {
      errors.push("Recurring income must be of type 'salário'.");
    }
    if (recurring === true && type === 'saida' && !['parcelamento', 'assinatura'].includes(recurringType)) {
      errors.push("Recurring expenses must be 'parcelamento' or 'assinatura'.");
    }
    if (recurring === true && !recurringType) {
      errors.push("Recurring transactions require a recurrence type.");
    }
    if (amount <= 0) {
      errors.push("Amount must be greater than zero.");
    }
    if (type === 'transferencia' && account_id === destination_account_id) {
      errors.push("Source and destination accounts must be different for transfers.");
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ valid: false, errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ valid: false, errors: [error.message] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});