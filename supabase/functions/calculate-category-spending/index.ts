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
    const { userId, month, year, categoryId } = await req.json();
    if (!userId || !month || !year) throw new Error("Missing params");
    // Optimized: Use the View
    let query = supabaseClient.from('vw_expense_by_category_monthly').select('*').eq('user_id', userId).eq('month', month).eq('year', year);
    if (categoryId) {
      query = query.eq('categoria_id', categoryId);
    }
    const { data: viewData, error } = await query;
    if (error) throw error;
    // The view returns pre-aggregated data.
    // If we need detailed transactions list as per original requirement, 
    // we would still need to fetch them separately if requested.
    // However, for "calculate-category-spending" summary, the view is sufficient for totals.
    // If the frontend explicitly needs the list of transactions, we can fetch them.
    // The previous implementation returned `transactions: []`.
    // Let's keep it lightweight. If transactions are needed, frontend should use the raw transactions endpoint.
    // But to maintain contract, we return the totals.
    // We also need category limit which is in 'categorias' table, but view includes category_id.
    // We can join or fetch limits. The view doesn't have 'limit'.
    // Let's fetch limits separately or join in code.
    // To minimize breaking changes, let's fetch categories for limits.
    const { data: categories } = await supabaseClient.from('categorias').select('id, limite_gasto').eq('user_id', userId);
    const limitMap = {};
    categories?.forEach((c)=>limitMap[c.id] = Number(c.limite_gasto || 0));
    const results = viewData.map((item)=>{
      const limit = limitMap[item.categoria_id] || 0;
      return {
        categoryName: item.category_name,
        totalSpent: Number(item.total_amount),
        limit: limit,
        percentageOfLimit: limit > 0 ? Number(item.total_amount) / limit * 100 : 0,
        transactions: [] // Simplified for performance, or fetch if critical
      };
    });
    if (categoryId) {
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
