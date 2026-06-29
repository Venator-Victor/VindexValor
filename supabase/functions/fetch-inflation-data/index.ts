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

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Service role client used only for the upsert into inflation_data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body: Record<string, unknown> = {};
    try {
      const text = await req.text();
      if (text && text.length > 0) body = JSON.parse(text);
    } catch (_e) {
      // empty body is fine
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    let startMonth = (body.startMonth as number) || currentMonth - 11;
    let startYear = (body.startYear as number) || currentYear - 1;
    if (startMonth <= 0) {
      startMonth += 12;
      startYear -= 1;
    }

    const isSyncAll = body.syncAll === true;
    const apiStartDate = isSyncAll ? '01/01/1995' : `01/${String(startMonth).padStart(2, '0')}/${startYear}`;
    const apiEndDate = `${String(now.getDate()).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}/${currentYear}`;
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${apiStartDate}&dataFinal=${apiEndDate}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VindexFinance/1.0; +https://vindex.app)',
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`BCB API failed: ${response.status}`);

    const rawData = await response.json();
    if (!Array.isArray(rawData)) throw new Error("Invalid BCB response");

    const records = [];
    for (const item of rawData) {
      const [, month, year] = item.data.split('/');
      const period = `${year}-${month}`;
      const valStr = typeof item.valor === 'string' ? item.valor.replace(',', '.') : String(item.valor);
      const valNum = parseFloat(valStr);
      if (!isNaN(valNum)) {
        records.push({
          period,
          inflation_value: valNum,
          data_source: 'BCB_IPCA',
          updated_at: new Date().toISOString()
        });
      }
    }

    if (records.length > 0) {
      const { error } = await supabaseAdmin.from('inflation_data').upsert(records, { onConflict: 'period' });
      if (error) throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      recordsFetched: rawData.length,
      recordsUpdated: records.length,
      message: `Successfully synced ${records.length} inflation records.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});