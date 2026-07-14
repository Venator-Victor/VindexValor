import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from "./cors.ts";

// Deletes every row owned by the calling user, then removes the auth user itself.
// Order matters: several FKs are ON DELETE RESTRICT (not CASCADE), so children
// must be cleared before the rows they reference, or the deletes below will fail.
const DATA_TABLES_IN_DELETE_ORDER = [
  'invoice_items',
  'recurring_installments',
  'custom_category_mappings',
  'transactions',
  'recurring_items',
  'invoices',
  'investments',
  'goals',
  'accounts',
  'categories',
  'settings',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Auth Header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // User-scoped client: every delete below runs as the caller, under RLS,
    // so this function can never touch another user's rows even if the
    // ordering above were somehow wrong.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    for (const table of DATA_TABLES_IN_DELETE_ORDER) {
      const { error } = await userClient.from(table).delete().eq('user_id', user.id);
      if (error) {
        return new Response(JSON.stringify({ error: `Failed clearing ${table}: ${error.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Deleting the auth user requires the service role; nothing above can do it.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      return new Response(JSON.stringify({ error: `Failed deleting auth user: ${deleteUserError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
