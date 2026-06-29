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
    const { tipo, recorrente, tipoRecorrente, valor, account_id, destination_account_id } = data;
    const errors = [];

    if (tipo === 'transferencia' && recorrente === true) {
      errors.push("Transferências não podem ser recorrentes.");
    }
    if (recorrente === true && tipo === 'entrada' && tipoRecorrente !== 'salário') {
      errors.push("Entradas recorrentes devem ser do tipo 'salário'.");
    }
    if (recorrente === true && tipo === 'saida' && !['parcelamento', 'assinatura'].includes(tipoRecorrente)) {
      errors.push("Saídas recorrentes devem ser 'parcelamento' ou 'assinatura'.");
    }
    if (recorrente === true && !tipoRecorrente) {
      errors.push("Transações recorrentes exigem um tipo de recorrência.");
    }
    if (valor <= 0) {
      errors.push("O valor deve ser maior que zero.");
    }
    if (tipo === 'transferencia' && account_id === destination_account_id) {
      errors.push("Conta de origem e destino devem ser diferentes para transferências.");
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