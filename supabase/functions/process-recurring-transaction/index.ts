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
    const { recorrenciaId, userId } = await req.json();
    if (!recorrenciaId || !userId) throw new Error("Missing parameters");
    // 1. Fetch Recorrencia
    const { data: rule, error: fetchError } = await supabaseClient.from('recorrencias').select('*').eq('id', recorrenciaId).eq('user_id', userId).single();
    if (fetchError || !rule) throw new Error("Recurrence not found");
    // 2. Create Transaction
    const newTx = {
      user_id: userId,
      description: rule.description,
      amount: rule.amount,
      type: Number(rule.amount) < 0 ? 'saida' : 'entrada',
      date: rule.next_date,
      categoria_id: rule.categoria_id,
      is_recurring: true,
      recurring_id: rule.id,
      created_at: new Date().toISOString()
    };
    const { data: txData, error: txError } = await supabaseClient.from('transacoes').insert(newTx).select().single();
    if (txError) throw txError;
    // 3. Calculate Next Date
    const currentNext = new Date(rule.next_date);
    let nextDateObj = new Date(currentNext);
    switch(rule.frequency){
      case 'Semanal':
        nextDateObj.setDate(nextDateObj.getDate() + 7);
        break;
      case 'Quinzenal':
        nextDateObj.setDate(nextDateObj.getDate() + 15);
        break;
      case 'Mensal':
        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        break;
      case 'Trimestral':
        nextDateObj.setMonth(nextDateObj.getMonth() + 3);
        break;
      case 'Semestral':
        nextDateObj.setMonth(nextDateObj.getMonth() + 6);
        break;
      case 'Anual':
        nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
        break;
      default:
        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
    }
    const nextDateStr = nextDateObj.toISOString().split('T')[0];
    // 4. Update Recurrence
    const { error: updateError } = await supabaseClient.from('recorrencias').update({
      next_date: nextDateStr
    }).eq('id', rule.id);
    if (updateError) throw updateError;
    // 5. Handle Parcels (if applicable)
    if (rule.recurrence_type === 'Parcelas' && rule.numero_parcelas) {
    // Decrement logic or mark parcel as paid? 
    // Logic in FinanceContext.jsx handles 'recorrencia_parcelas'.
    // If this edge function is replacing that logic, we should update 'recorrencia_parcelas' status.
    // Assuming we just mark the relevant parcel as paid if exists?
    // Or simple counter?
    // For now, basic implementation just updates date.
    }
    return new Response(JSON.stringify({
      success: true,
      transactionId: txData.id,
      nextDate: nextDateStr
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
