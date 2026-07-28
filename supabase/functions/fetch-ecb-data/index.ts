import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";

// ECB Data Portal series used for the Euro-area money-supply-vs-inflation
// comparison. Both are level indices (not % rates), same treatment as the
// US branch — the frontend indexes them directly. No API key required.
// M2   = Balance Sheet Items (BSI), monetary aggregate M2, stocks, EUR millions, since 1996-01
// HICP = the ECB's "HICP" dataflow (flowRef ICP was discontinued Feb/2026 and
// stopped updating; HICP is its replacement, with a consistently-rebased
// history back to 1996-01 — don't switch back to ICP, it's frozen at 2025-12).
const SERIES = [
  { flowRef: 'BSI', key: 'M.U2.Y.V.M20.X.1.U2.2300.Z01.E', indicator: 'M2' },
  { flowRef: 'HICP', key: 'M.U2.N.000000.4D0.INX', indicator: 'CPI' },
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
    const startPeriod = isSyncAll ? '1996-01' : `${startYear}-${String(startMonth).padStart(2, '0')}`;

    let totalFetched = 0;
    const allRecords = [];

    for (const { flowRef, key, indicator } of SERIES) {
      const url = `https://data-api.ecb.europa.eu/service/data/${flowRef}/${key}?format=jsondata&startPeriod=${startPeriod}`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`ECB API failed for ${flowRef}: ${response.status}`);

      const json = await response.json();
      const dataset = json.dataSets?.[0];
      const seriesMap = dataset?.series ?? {};
      const seriesEntry = Object.values(seriesMap)[0] as { observations?: Record<string, unknown[]> } | undefined;
      const observations = seriesEntry?.observations ?? {};
      const timeValues = json.structure?.dimensions?.observation?.[0]?.values ?? [];

      const indices = Object.keys(observations);
      totalFetched += indices.length;

      for (const idx of indices) {
        const raw = observations[idx]?.[0];
        if (raw === null || raw === undefined) continue;
        const valNum = Number(raw);
        if (isNaN(valNum)) continue;
        const period = timeValues[Number(idx)]?.id;
        if (!period) continue;
        allRecords.push({
          country: 'EU',
          indicator,
          period,
          value: valNum,
          data_source: 'ECB',
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
      message: `Successfully synced ${allRecords.length} ECB records.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
