-- Fix missing WITH CHECK on invoice_items and invoices RLS policies.
-- USING alone does not enforce ownership on INSERT/UPDATE; WITH CHECK is required.

DROP POLICY "Users can manage their own compras_fatura" ON "public"."invoice_items";
CREATE POLICY "Users can manage their own compras_fatura" ON "public"."invoice_items"
  USING (("auth"."uid"() = "user_id"))
  WITH CHECK (("auth"."uid"() = "user_id"));

DROP POLICY "Users can manage their own faturas" ON "public"."invoices";
CREATE POLICY "Users can manage their own faturas" ON "public"."invoices"
  USING (("auth"."uid"() = "user_id"))
  WITH CHECK (("auth"."uid"() = "user_id"));