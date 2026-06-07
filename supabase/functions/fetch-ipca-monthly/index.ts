import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    // Check authentication. Cron will pass service role key, users pass their JWT.
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
    const supabaseKey = authHeader.replace('Bearer ', '');
    const isServiceRole = supabaseKey === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    });
    const bcbUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json';
    const bcbResponse = await fetch(bcbUrl);
    if (!bcbResponse.ok) throw new Error(`Failed to fetch from BCB: ${bcbResponse.status}`);
    const bcbData = await bcbResponse.json();
    const results = [];
    for (const item of bcbData){
      const [day, month, year] = item.data.split('/');
      const period = `${year}-${month}`;
      const inflationValue = parseFloat(item.valor);
      const record = {
        period: period,
        inflation_value: inflationValue,
        data_source: 'BCB',
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('inflation_data').upsert(record, {
        onConflict: 'period'
      });
      if (error) {
        if (!isServiceRole) {
          throw new Error('RLS Violation: Only service role can modify inflation data.');
        }
        results.push({
          period,
          status: 'error',
          error: error.message
        });
      } else {
        results.push({
          period,
          status: 'success'
        });
      }
    }
    return new Response(JSON.stringify({
      success: true,
      processed: results.length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: error.message.includes('RLS') ? 403 : 500
    });
  }
});
