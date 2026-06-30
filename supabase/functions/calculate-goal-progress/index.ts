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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = user.id;
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { goalId } = await req.json();
    let query = supabaseClient.from('goals').select('*').eq('user_id', userId);
    if (goalId) {
      query = query.eq('id', goalId);
    }
    const { data: goals, error } = await query;
    if (error) throw error;
    const results = goals.map((goal)=>{
      const target = Number(goal.target_amount);
      const current = Number(goal.current_amount || goal.accumulated_amount || 0);
      const progressPercentage = target > 0 ? current / target * 100 : 0;
      let daysRemaining = null;
      let isOnTrack = true; // Simple logic
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const diffTime = deadline.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Basic "On Track" logic: if days remaining is very low but progress low -> false
        // E.g. less than 10% time left but less than 80% progress?
        // For simplicity: just true for now, or based on deadline passed
        if (daysRemaining < 0 && progressPercentage < 100) isOnTrack = false;
      }
      return {
        goalName: goal.name,
        targetAmount: target,
        currentAmount: current,
        progressPercentage,
        daysRemaining,
        isOnTrack
      };
    });
    if (goalId) {
      return new Response(JSON.stringify(results[0] || {}), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify(results), {
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
