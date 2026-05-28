import { corsHeaders } from "./cors.ts";
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { investedAmount, currentAmount } = await req.json();
    if (investedAmount === undefined || currentAmount === undefined) {
      throw new Error("Missing required parameters: investedAmount, currentAmount");
    }
    const initial = Number(investedAmount);
    const current = Number(currentAmount);
    // Prevent division by zero
    if (initial === 0) {
      return new Response(JSON.stringify({
        returnAmount: current,
        returnPercentage: 0,
        isPositive: current >= 0
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const returnAmount = current - initial;
    const returnPercentage = returnAmount / initial * 100;
    const isPositive = returnAmount >= 0;
    return new Response(JSON.stringify({
      returnAmount,
      returnPercentage,
      isPositive
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
