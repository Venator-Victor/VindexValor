import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";

// FRED series used for the US money-supply-vs-inflation comparison:
// M2SL      = M2 money stock, billions of USD, monthly, since 1959-01
// CPIAUCSL  = CPI for all urban consumers, index (1982-84=100), since 1947-01
// Both are levels (not % rates), so the frontend indexes them the same way.
const SERIES = [
  { seriesId: 'M2SL', indicator: 'M2' },
  { seriesId: 'CPIAUCSL', indicator: 'CPI' },
];

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

    const fredApiKey = Deno.env.get('FRED_API_KEY');
    if (!fredApiKey) {
      return new Response(JSON.stringify({ error: 'FRED_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Service role client used only for the upsert into foreign_economic_indicators
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
    const observationStart = isSyncAll ? '1959-01-01' : `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
    const observationEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let totalFetched = 0;
    const allRecords = [];

    for (const { seriesId, indicator } of SERIES) {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&file_type=json&api_key=${fredApiKey}&observation_start=${observationStart}&observation_end=${observationEnd}`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`FRED API failed for ${seriesId}: ${response.status}`);

      const json = await response.json();
      const observations = json.observations;
      if (!Array.isArray(observations)) throw new Error(`Invalid FRED response for ${seriesId}`);
      totalFetched += observations.length;

      for (const obs of observations) {
        if (obs.value === '.' || obs.value == null) continue;
        const valNum = parseFloat(obs.value);
        if (isNaN(valNum)) continue;
        const [year, month] = obs.date.split('-');
        allRecords.push({
          country: 'US',
          indicator,
          period: `${year}-${month}`,
          value: valNum,
          data_source: 'FRED',
          updated_at: new Date().toISOString()
        });
      }
    }

    if (allRecords.length > 0) {
      const { error } = await supabaseAdmin
        .from('foreign_economic_indicators')
        .upsert(allRecords, { onConflict: 'country,indicator,period' });
      if (error) throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      recordsFetched: totalFetched,
      recordsUpdated: allRecords.length,
      message: `Successfully synced ${allRecords.length} FRED records.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
