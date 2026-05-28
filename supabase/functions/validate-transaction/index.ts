import { corsHeaders } from "./cors.ts";
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const data = await req.json();
    const { tipo, recorrente, tipoRecorrente, valor, conta_id, conta_destino_id } = data;
    const errors = [];
    if (tipo === 'transferencia' && recorrente === true) {
      errors.push("Transferências não podem ser recorrentes.");
    }
    if (recorrente === true && tipo === 'entrada' && tipoRecorrente !== 'salário') {
      errors.push("Entradas recorrentes devem ser do tipo 'salário'.");
    }
    if (recorrente === true && tipo === 'saida' && ![
      'parcelamento',
      'assinatura'
    ].includes(tipoRecorrente)) {
      errors.push("Saídas recorrentes devem ser 'parcelamento' ou 'assinatura'.");
    }
    if (recorrente === true && !tipoRecorrente) {
      errors.push("Transações recorrentes exigem um tipo de recorrência.");
    }
    if (valor <= 0) {
      errors.push("O valor deve ser maior que zero.");
    }
    if (tipo === 'transferencia' && conta_id === conta_destino_id) {
      errors.push("Conta de origem e destino devem ser diferentes para transferências.");
    }
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        valid: false,
        errors
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    return new Response(JSON.stringify({
      valid: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      valid: false,
      errors: [
        error.message
      ]
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
