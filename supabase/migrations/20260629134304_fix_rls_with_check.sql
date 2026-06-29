-- Fix missing WITH CHECK on compras_fatura and faturas RLS policies.
-- USING alone does not enforce ownership on INSERT/UPDATE; WITH CHECK is required.

DROP POLICY "Users can manage their own compras_fatura" ON "public"."compras_fatura";
CREATE POLICY "Users can manage their own compras_fatura" ON "public"."compras_fatura"
  USING (("auth"."uid"() = "user_id"))
  WITH CHECK (("auth"."uid"() = "user_id"));

DROP POLICY "Users can manage their own faturas" ON "public"."faturas";
CREATE POLICY "Users can manage their own faturas" ON "public"."faturas"
  USING (("auth"."uid"() = "user_id"))
  WITH CHECK (("auth"."uid"() = "user_id"));