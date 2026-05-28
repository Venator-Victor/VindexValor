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
    const { data: recurrences, error } = await supabaseClient.from('recorrencias').select('*').eq('user_id', userId).eq('status', 'Ativo');
    if (error) throw error;
    let totalMonthlyRecurring = 0;
    const byFrequency = {};
    const upcomingRecurrences = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    recurrences.forEach((rec)=>{
      const amount = Number(rec.amount);
      const freq = rec.frequency;
      // Normalize to monthly for total estimation
      let monthlyAmount = amount;
      if (freq === 'Semanal') monthlyAmount = amount * 4;
      else if (freq === 'Quinzenal') monthlyAmount = amount * 2;
      else if (freq === 'Trimestral') monthlyAmount = amount / 3;
      else if (freq === 'Semestral') monthlyAmount = amount / 6;
      else if (freq === 'Anual') monthlyAmount = amount / 12;
      totalMonthlyRecurring += monthlyAmount;
      if (!byFrequency[freq]) byFrequency[freq] = 0;
      byFrequency[freq] += amount;
      // Check if upcoming
      const nextDate = new Date(rec.next_date);
      if (nextDate >= now && nextDate <= thirtyDaysFromNow) {
        upcomingRecurrences.push(rec);
      }
    });
    return new Response(JSON.stringify({
      totalMonthlyRecurring,
      upcomingRecurrences,
      byFrequency
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
