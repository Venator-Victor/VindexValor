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
    let body = {};
    try {
      const text = await req.text();
      if (text && text.length > 0) body = JSON.parse(text);
    } catch (e) {
    // Ignore parse error if body is empty
    }
    // Default to last 12 months if no range provided
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    let startMonth = body.startMonth || currentMonth - 11; // Rough logic
    let startYear = body.startYear || currentYear - 1;
    // Fix overflow/underflow logic for defaults
    if (startMonth <= 0) {
      startMonth += 12;
      startYear -= 1;
    }
    // Determine API Date Range
    // BCB API expects DD/MM/YYYY
    // We fetch a wide range to ensure we cover gaps
    // Let's fetch last 5 years by default to be safe if 'syncAll' is true
    const isSyncAll = body.syncAll === true;
    const apiStartDate = isSyncAll ? '01/01/2015' : `01/${String(startMonth).padStart(2, '0')}/${startYear}`;
    const apiEndDate = `${String(now.getDate()).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}/${currentYear}`;
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${apiStartDate}&dataFinal=${apiEndDate}`;
    console.log(`Fetching from BCB: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VindexFinance/1.0; +https://vindex.app)',
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`BCB API failed: ${response.status}`);
    const rawData = await response.json();
    if (!Array.isArray(rawData)) throw new Error("Invalid BCB response");
    let upsertCount = 0;
    const records = [];
    // Parse and Prepare Upsert
    for (const item of rawData){
      // item: { data: "DD/MM/YYYY", valor: "0.53" }
      const [day, month, year] = item.data.split('/');
      const period = `${year}-${month}`; // YYYY-MM
      const valStr = typeof item.valor === 'string' ? item.valor.replace(',', '.') : String(item.valor);
      const valNum = parseFloat(valStr);
      if (!isNaN(valNum)) {
        records.push({
          period: period,
          inflation_value: valNum,
          data_source: 'BCB_IPCA',
          updated_at: new Date().toISOString()
        });
      }
    }
    // Batch Upsert
    if (records.length > 0) {
      const { error } = await supabaseClient.from('inflation_data').upsert(records, {
        onConflict: 'period'
      });
      if (error) throw error;
      upsertCount = records.length;
    }
    return new Response(JSON.stringify({
      success: true,
      recordsFetched: rawData.length,
      recordsUpdated: upsertCount,
      message: `Successfully synced ${upsertCount} inflation records.`
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Fetch Error:", error);
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
