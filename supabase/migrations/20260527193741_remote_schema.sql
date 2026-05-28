


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#283768'::"text",
    "icon" "text" DEFAULT 'bx bx-tag'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "limite_gasto" numeric,
    "periodo_limite" "text"
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compras_fatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "fatura_id" "uuid" NOT NULL,
    "data" "date" NOT NULL,
    "descricao" "text" NOT NULL,
    "categoria_id" "uuid",
    "conta_id" "uuid",
    "valor" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "parcel_number" integer,
    "total_parcels" integer,
    "is_parcelado" boolean DEFAULT false,
    "transacao_id" "uuid"
);


ALTER TABLE "public"."compras_fatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'dark'::"text",
    "currency" "text" DEFAULT 'BRL'::"text",
    "language" "text" DEFAULT 'pt-BR'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "metas_view_preference" "text" DEFAULT 'card'::"text",
    "categorias_period_preference" "text" DEFAULT 'mensal'::"text",
    "transacoes_view_preference" "text" DEFAULT 'list'::"text",
    "investimentos_view_preference" "text" DEFAULT 'list'::"text",
    "recorrencias_view_preference" "text" DEFAULT 'list'::"text",
    "contas_view_preference" "text"
);


ALTER TABLE "public"."configuracoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "bank" "text",
    "balance" numeric DEFAULT 0 NOT NULL,
    "color" "text" DEFAULT '#283768'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "icon" "text",
    "account_subtype" "text",
    "credit_limit" numeric,
    "closing_date" integer,
    "due_date" integer,
    "investment_type" "text",
    "expected_return" numeric,
    "reload_value" numeric,
    "reload_date" integer,
    "total_amount" numeric,
    "interest_rate" numeric,
    "term_months" integer,
    "amortization_type" "text",
    "holders" "jsonb" DEFAULT '[]'::"jsonb",
    "initial_balance" numeric DEFAULT 0,
    "currency" "text" DEFAULT 'BRL'::"text",
    "crypto_symbol" "text",
    CONSTRAINT "check_account_subtype_validity" CHECK (((("type" = ANY (ARRAY['Cartão de Crédito'::"text", 'Investimentos'::"text", 'Vale-Refeição'::"text", 'Vale-Alimentação'::"text", 'Empréstimos'::"text"])) AND ("account_subtype" IS NOT NULL)) OR (("type" <> ALL (ARRAY['Cartão de Crédito'::"text", 'Investimentos'::"text", 'Vale-Refeição'::"text", 'Vale-Alimentação'::"text", 'Empréstimos'::"text"])) AND ("account_subtype" IS NULL))))
);


ALTER TABLE "public"."contas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_category_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."custom_category_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faturas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "numero_fatura" "text",
    "data_abertura" "date",
    "data_fechamento" "date",
    "valor_total" numeric DEFAULT 0,
    "status" "text" DEFAULT 'aberta'::"text",
    "conta_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "faturas_status_check" CHECK (("status" = ANY (ARRAY['aberta'::"text", 'fechada'::"text", 'paga'::"text"])))
);


ALTER TABLE "public"."faturas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inflation_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period" "text" NOT NULL,
    "inflation_value" numeric NOT NULL,
    "data_source" "text" DEFAULT 'BCB_IPCA'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."inflation_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investimentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "invested_amount" numeric NOT NULL,
    "current_amount" numeric NOT NULL,
    "purchase_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "subtype" "text",
    "account_id" "uuid"
);


ALTER TABLE "public"."investimentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."metas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "target_amount" numeric NOT NULL,
    "current_amount" numeric DEFAULT 0 NOT NULL,
    "deadline" "date" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3b82f6'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "icon" "text" DEFAULT 'bx-target-lock'::"text",
    "tipo_meta" "text" DEFAULT 'valor_final'::"text",
    "conta_reservada_id" "uuid",
    "valor_reservado" numeric DEFAULT 0,
    "valor_acumulado" numeric DEFAULT 0,
    "contribution_value" numeric DEFAULT 0,
    "period_frequency" "text" DEFAULT 'Mensal'::"text",
    "account_reservations" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."metas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recorrencia_parcelas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "recorrencia_id" "uuid" NOT NULL,
    "parcel_number" integer NOT NULL,
    "amount" numeric NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "text",
    "created_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."recorrencia_parcelas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recorrencias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "frequency" "text" NOT NULL,
    "next_date" "date" NOT NULL,
    "status" "text" DEFAULT 'Ativo'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "recurrence_type" "text",
    "numero_parcelas" integer,
    "categoria_id" "uuid"
);


ALTER TABLE "public"."recorrencias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text",
    "amount" numeric NOT NULL,
    "type" "text" NOT NULL,
    "date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_recurring" boolean DEFAULT false,
    "recurring_id" "uuid",
    "original_amount" numeric,
    "is_future_only" boolean DEFAULT false,
    "name" "text",
    "titular_responsavel" "text",
    "categoria_id" "uuid",
    "conta_id" "uuid",
    "conta_destino_id" "uuid",
    "transaction_type_id" "uuid",
    "tipo_recorrente" "text",
    "exchange_rate" numeric,
    "converted_amount" numeric,
    "fatura_id" "uuid",
    CONSTRAINT "chk_entrada_recorrente" CHECK (((NOT (("is_recurring" = true) AND ("type" = 'entrada'::"text"))) OR ("tipo_recorrente" = 'salário'::"text"))),
    CONSTRAINT "chk_recorrente_not_null" CHECK ((("is_recurring" = false) OR ("is_recurring" IS NULL) OR ("tipo_recorrente" IS NOT NULL))),
    CONSTRAINT "chk_saida_recorrente" CHECK (((NOT (("is_recurring" = true) AND ("type" = 'saida'::"text"))) OR ("tipo_recorrente" = ANY (ARRAY['parcelamento'::"text", 'assinatura'::"text"])))),
    CONSTRAINT "chk_transferencia_recorrente" CHECK ((("type" <> 'transferencia'::"text") OR ("is_recurring" = false))),
    CONSTRAINT "chk_transferencia_tipo_recorrente" CHECK ((("type" <> 'transferencia'::"text") OR ("tipo_recorrente" IS NULL))),
    CONSTRAINT "chk_valor_positivo" CHECK (("abs"("amount") > (0)::numeric))
);


ALTER TABLE "public"."transacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "is_recurring" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transaction_types" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_account_monthly_flow" WITH ("security_invoker"='on') AS
 WITH "monthly_flow" AS (
         SELECT "transacoes"."user_id",
            "transacoes"."conta_id" AS "account_id",
            "transacoes"."date",
                CASE
                    WHEN ("transacoes"."type" = 'entrada'::"text") THEN "transacoes"."amount"
                    WHEN ("transacoes"."type" = 'saida'::"text") THEN (- "abs"("transacoes"."amount"))
                    WHEN ("transacoes"."type" = 'transferencia'::"text") THEN (- "abs"("transacoes"."amount"))
                    ELSE (0)::numeric
                END AS "flow"
           FROM "public"."transacoes"
          WHERE ("transacoes"."conta_id" IS NOT NULL)
        UNION ALL
         SELECT "transacoes"."user_id",
            "transacoes"."conta_destino_id" AS "account_id",
            "transacoes"."date",
            "abs"("transacoes"."amount") AS "flow"
           FROM "public"."transacoes"
          WHERE (("transacoes"."type" = 'transferencia'::"text") AND ("transacoes"."conta_destino_id" IS NOT NULL))
        )
 SELECT "user_id",
    "account_id",
    EXTRACT(year FROM "date") AS "year",
    EXTRACT(month FROM "date") AS "month",
    "sum"("flow") AS "net_flow"
   FROM "monthly_flow"
  GROUP BY "user_id", "account_id", (EXTRACT(year FROM "date")), (EXTRACT(month FROM "date"));


ALTER VIEW "public"."vw_account_monthly_flow" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_account_overview" WITH ("security_invoker"='on') AS
 SELECT "user_id",
    "id" AS "account_id",
    "name",
    "type",
    "balance"
   FROM "public"."contas";


ALTER VIEW "public"."vw_account_overview" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_category_spending" WITH ("security_invoker"='true') AS
 SELECT "t"."user_id",
    "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "c"."color" AS "category_color",
    "c"."limite_gasto",
    "sum"("abs"("t"."amount")) AS "total_spent"
   FROM ("public"."transacoes" "t"
     JOIN "public"."categorias" "c" ON (("t"."categoria_id" = "c"."id")))
  WHERE ("t"."type" = 'saida'::"text")
  GROUP BY "t"."user_id", "c"."id", "c"."name", "c"."color", "c"."limite_gasto";


ALTER VIEW "public"."vw_category_spending" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_dashboard_summary" WITH ("security_invoker"='on') AS
 SELECT "user_id",
    COALESCE("sum"(
        CASE
            WHEN ("type" = 'entrada'::"text") THEN "amount"
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_income",
    COALESCE("sum"(
        CASE
            WHEN ("type" = 'saida'::"text") THEN "abs"("amount")
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_expense",
    COALESCE("sum"(
        CASE
            WHEN ("type" = 'entrada'::"text") THEN "amount"
            ELSE "amount"
        END), (0)::numeric) AS "net_balance"
   FROM "public"."transacoes"
  GROUP BY "user_id";


ALTER VIEW "public"."vw_dashboard_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_expense_by_category_monthly" WITH ("security_invoker"='on') AS
 SELECT "t"."user_id",
    "t"."categoria_id",
    "c"."name" AS "category_name",
    "c"."color" AS "category_color",
    EXTRACT(month FROM "t"."date") AS "month",
    EXTRACT(year FROM "t"."date") AS "year",
    "sum"("abs"("t"."amount")) AS "total_amount",
    "count"("t"."id") AS "transaction_count"
   FROM ("public"."transacoes" "t"
     LEFT JOIN "public"."categorias" "c" ON (("t"."categoria_id" = "c"."id")))
  WHERE ("t"."type" = 'saida'::"text")
  GROUP BY "t"."user_id", "t"."categoria_id", "c"."name", "c"."color", (EXTRACT(month FROM "t"."date")), (EXTRACT(year FROM "t"."date"));


ALTER VIEW "public"."vw_expense_by_category_monthly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_goal_progress" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "id" AS "goal_id",
    "name",
    "target_amount",
    "current_amount",
    "deadline",
        CASE
            WHEN ("target_amount" > (0)::numeric) THEN (("current_amount" / "target_amount") * (100)::numeric)
            ELSE (0)::numeric
        END AS "progress_percentage"
   FROM "public"."metas";


ALTER VIEW "public"."vw_goal_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_income_vs_expense_monthly" WITH ("security_invoker"='on') AS
 SELECT "user_id",
    EXTRACT(month FROM "date") AS "month",
    EXTRACT(year FROM "date") AS "year",
    "sum"(
        CASE
            WHEN ("type" = 'entrada'::"text") THEN "amount"
            ELSE (0)::numeric
        END) AS "total_income",
    "sum"(
        CASE
            WHEN ("type" = 'saida'::"text") THEN "abs"("amount")
            ELSE (0)::numeric
        END) AS "total_expense",
    ("sum"(
        CASE
            WHEN ("type" = 'entrada'::"text") THEN "amount"
            ELSE (0)::numeric
        END) - "sum"(
        CASE
            WHEN ("type" = 'saida'::"text") THEN "abs"("amount")
            ELSE (0)::numeric
        END)) AS "net_balance"
   FROM "public"."transacoes" "t"
  GROUP BY "user_id", (EXTRACT(month FROM "date")), (EXTRACT(year FROM "date"));


ALTER VIEW "public"."vw_income_vs_expense_monthly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_investment_performance" WITH ("security_invoker"='on') AS
 SELECT "id" AS "investment_id",
    "user_id",
    "name",
    "type",
    "subtype",
    "invested_amount",
    "current_amount",
    ("current_amount" - "invested_amount") AS "return_amount",
        CASE
            WHEN ("invested_amount" > (0)::numeric) THEN ((("current_amount" - "invested_amount") / "invested_amount") * (100)::numeric)
            ELSE (0)::numeric
        END AS "return_percentage"
   FROM "public"."investimentos" "i";


ALTER VIEW "public"."vw_investment_performance" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_investment_summary" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "sum"("invested_amount") AS "total_invested",
    "sum"("current_amount") AS "total_current",
    ("sum"("current_amount") - "sum"("invested_amount")) AS "total_return"
   FROM "public"."investimentos"
  GROUP BY "user_id";


ALTER VIEW "public"."vw_investment_summary" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compras_fatura"
    ADD CONSTRAINT "compras_fatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_category_mappings"
    ADD CONSTRAINT "custom_category_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_category_mappings"
    ADD CONSTRAINT "custom_category_mappings_user_id_description_key" UNIQUE ("user_id", "description");



ALTER TABLE ONLY "public"."faturas"
    ADD CONSTRAINT "faturas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inflation_data"
    ADD CONSTRAINT "inflation_data_period_key" UNIQUE ("period");



ALTER TABLE ONLY "public"."inflation_data"
    ADD CONSTRAINT "inflation_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investimentos"
    ADD CONSTRAINT "investimentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metas"
    ADD CONSTRAINT "metas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recorrencia_parcelas"
    ADD CONSTRAINT "recorrencia_parcelas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recorrencias"
    ADD CONSTRAINT "recorrencias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_types"
    ADD CONSTRAINT "transaction_types_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_categorias_user_id" ON "public"."categorias" USING "btree" ("user_id");



CREATE INDEX "idx_configuracoes_user_id" ON "public"."configuracoes" USING "btree" ("user_id");



CREATE INDEX "idx_contas_user_id" ON "public"."contas" USING "btree" ("user_id");



CREATE INDEX "idx_inflation_data_period" ON "public"."inflation_data" USING "btree" ("period");



CREATE INDEX "idx_inflation_data_updated_at" ON "public"."inflation_data" USING "btree" ("updated_at");



CREATE INDEX "idx_investimentos_user_id" ON "public"."investimentos" USING "btree" ("user_id");



CREATE INDEX "idx_metas_user_id" ON "public"."metas" USING "btree" ("user_id");



CREATE INDEX "idx_recorrencias_user_id" ON "public"."recorrencias" USING "btree" ("user_id");



CREATE INDEX "idx_transacoes_categoria_id" ON "public"."transacoes" USING "btree" ("categoria_id");



CREATE INDEX "idx_transacoes_conta_id" ON "public"."transacoes" USING "btree" ("conta_id");



CREATE INDEX "idx_transacoes_date" ON "public"."transacoes" USING "btree" ("date");



CREATE INDEX "idx_transacoes_user_id" ON "public"."transacoes" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compras_fatura"
    ADD CONSTRAINT "compras_fatura_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id");



ALTER TABLE ONLY "public"."compras_fatura"
    ADD CONSTRAINT "compras_fatura_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."compras_fatura"
    ADD CONSTRAINT "compras_fatura_fatura_id_fkey" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compras_fatura"
    ADD CONSTRAINT "compras_fatura_transacao_id_fkey" FOREIGN KEY ("transacao_id") REFERENCES "public"."transacoes"("id");



ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_category_mappings"
    ADD CONSTRAINT "custom_category_mappings_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."faturas"
    ADD CONSTRAINT "faturas_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."recorrencias"
    ADD CONSTRAINT "fk_recorrencias_categoria" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "fk_transacoes_categoria" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "fk_transacoes_conta" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "fk_transacoes_conta_destino" FOREIGN KEY ("conta_destino_id") REFERENCES "public"."contas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."investimentos"
    ADD CONSTRAINT "investimentos_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."investimentos"
    ADD CONSTRAINT "investimentos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."metas"
    ADD CONSTRAINT "metas_conta_reservada_id_fkey" FOREIGN KEY ("conta_reservada_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."metas"
    ADD CONSTRAINT "metas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recorrencia_parcelas"
    ADD CONSTRAINT "recorrencia_parcelas_recorrencia_id_fkey" FOREIGN KEY ("recorrencia_id") REFERENCES "public"."recorrencias"("id");



ALTER TABLE ONLY "public"."recorrencias"
    ADD CONSTRAINT "recorrencias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "transacoes_fatura_id_fkey" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id");



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "transacoes_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "public"."recorrencias"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "transacoes_transaction_type_id_fkey" FOREIGN KEY ("transaction_type_id") REFERENCES "public"."transaction_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transacoes"
    ADD CONSTRAINT "transacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to read inflation data" ON "public"."inflation_data" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read transaction_types" ON "public"."transaction_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow service role to manage inflation data" ON "public"."inflation_data" TO "service_role" USING (true);



CREATE POLICY "Allow service role to manage transaction_types" ON "public"."transaction_types" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can delete their own accounts" ON "public"."contas" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own categories" ON "public"."categorias" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own goals" ON "public"."metas" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own investments" ON "public"."investimentos" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own parcels" ON "public"."recorrencia_parcelas" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own recurring" ON "public"."recorrencias" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own settings" ON "public"."configuracoes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own transactions" ON "public"."transacoes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own accounts" ON "public"."contas" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own categories" ON "public"."categorias" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own goals" ON "public"."metas" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own investments" ON "public"."investimentos" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own parcels" ON "public"."recorrencia_parcelas" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own recurring" ON "public"."recorrencias" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own settings" ON "public"."configuracoes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own transactions" ON "public"."transacoes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own categorias" ON "public"."categorias" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own compras_fatura" ON "public"."compras_fatura" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own configuracoes" ON "public"."configuracoes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own contas" ON "public"."contas" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own faturas" ON "public"."faturas" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own investimentos" ON "public"."investimentos" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own mappings" ON "public"."custom_category_mappings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own metas" ON "public"."metas" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own recorrencia_parcelas" ON "public"."recorrencia_parcelas" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own recorrencias" ON "public"."recorrencias" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own transacoes" ON "public"."transacoes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own accounts" ON "public"."contas" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own categories" ON "public"."categorias" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own goals" ON "public"."metas" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own investments" ON "public"."investimentos" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own parcels" ON "public"."recorrencia_parcelas" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own recurring" ON "public"."recorrencias" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own settings" ON "public"."configuracoes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own transactions" ON "public"."transacoes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own accounts" ON "public"."contas" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own categories" ON "public"."categorias" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own goals" ON "public"."metas" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own investments" ON "public"."investimentos" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own parcels" ON "public"."recorrencia_parcelas" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own recurring" ON "public"."recorrencias" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own settings" ON "public"."configuracoes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."transacoes" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compras_fatura" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configuracoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_category_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faturas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inflation_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investimentos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."metas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recorrencia_parcelas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recorrencias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transacoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_types" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





























































































































































































GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";
























GRANT ALL ON TABLE "public"."categorias" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."categorias" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."categorias" TO "anon";



GRANT ALL ON TABLE "public"."compras_fatura" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."compras_fatura" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."compras_fatura" TO "anon";



GRANT ALL ON TABLE "public"."configuracoes" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."configuracoes" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."configuracoes" TO "anon";



GRANT ALL ON TABLE "public"."contas" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contas" TO "anon";



GRANT ALL ON TABLE "public"."custom_category_mappings" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."custom_category_mappings" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."custom_category_mappings" TO "anon";



GRANT ALL ON TABLE "public"."faturas" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."faturas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."faturas" TO "anon";



GRANT ALL ON TABLE "public"."inflation_data" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."inflation_data" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."inflation_data" TO "anon";



GRANT ALL ON TABLE "public"."investimentos" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."investimentos" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."investimentos" TO "anon";



GRANT ALL ON TABLE "public"."metas" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."metas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."metas" TO "anon";



GRANT ALL ON TABLE "public"."recorrencia_parcelas" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."recorrencia_parcelas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."recorrencia_parcelas" TO "anon";



GRANT ALL ON TABLE "public"."recorrencias" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."recorrencias" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."recorrencias" TO "anon";



GRANT ALL ON TABLE "public"."transacoes" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."transacoes" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."transacoes" TO "anon";



GRANT ALL ON TABLE "public"."transaction_types" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."transaction_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."transaction_types" TO "anon";



GRANT ALL ON TABLE "public"."vw_account_monthly_flow" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_account_monthly_flow" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_account_monthly_flow" TO "anon";



GRANT ALL ON TABLE "public"."vw_account_overview" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_account_overview" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_account_overview" TO "anon";



GRANT ALL ON TABLE "public"."vw_category_spending" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_category_spending" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_category_spending" TO "anon";



GRANT ALL ON TABLE "public"."vw_dashboard_summary" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_dashboard_summary" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_dashboard_summary" TO "anon";



GRANT ALL ON TABLE "public"."vw_expense_by_category_monthly" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_expense_by_category_monthly" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_expense_by_category_monthly" TO "anon";



GRANT ALL ON TABLE "public"."vw_goal_progress" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_goal_progress" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_goal_progress" TO "anon";



GRANT ALL ON TABLE "public"."vw_income_vs_expense_monthly" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_income_vs_expense_monthly" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_income_vs_expense_monthly" TO "anon";



GRANT ALL ON TABLE "public"."vw_investment_performance" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_investment_performance" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_investment_performance" TO "anon";



GRANT ALL ON TABLE "public"."vw_investment_summary" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_investment_summary" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vw_investment_summary" TO "anon";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

revoke references on table "public"."categorias" from "anon";

revoke trigger on table "public"."categorias" from "anon";

revoke truncate on table "public"."categorias" from "anon";

revoke references on table "public"."categorias" from "authenticated";

revoke trigger on table "public"."categorias" from "authenticated";

revoke truncate on table "public"."categorias" from "authenticated";

revoke references on table "public"."compras_fatura" from "anon";

revoke trigger on table "public"."compras_fatura" from "anon";

revoke truncate on table "public"."compras_fatura" from "anon";

revoke references on table "public"."compras_fatura" from "authenticated";

revoke trigger on table "public"."compras_fatura" from "authenticated";

revoke truncate on table "public"."compras_fatura" from "authenticated";

revoke references on table "public"."configuracoes" from "anon";

revoke trigger on table "public"."configuracoes" from "anon";

revoke truncate on table "public"."configuracoes" from "anon";

revoke references on table "public"."configuracoes" from "authenticated";

revoke trigger on table "public"."configuracoes" from "authenticated";

revoke truncate on table "public"."configuracoes" from "authenticated";

revoke references on table "public"."contas" from "anon";

revoke trigger on table "public"."contas" from "anon";

revoke truncate on table "public"."contas" from "anon";

revoke references on table "public"."contas" from "authenticated";

revoke trigger on table "public"."contas" from "authenticated";

revoke truncate on table "public"."contas" from "authenticated";

revoke references on table "public"."custom_category_mappings" from "anon";

revoke trigger on table "public"."custom_category_mappings" from "anon";

revoke truncate on table "public"."custom_category_mappings" from "anon";

revoke references on table "public"."custom_category_mappings" from "authenticated";

revoke trigger on table "public"."custom_category_mappings" from "authenticated";

revoke truncate on table "public"."custom_category_mappings" from "authenticated";

revoke references on table "public"."faturas" from "anon";

revoke trigger on table "public"."faturas" from "anon";

revoke truncate on table "public"."faturas" from "anon";

revoke references on table "public"."faturas" from "authenticated";

revoke trigger on table "public"."faturas" from "authenticated";

revoke truncate on table "public"."faturas" from "authenticated";

revoke references on table "public"."inflation_data" from "anon";

revoke trigger on table "public"."inflation_data" from "anon";

revoke truncate on table "public"."inflation_data" from "anon";

revoke references on table "public"."inflation_data" from "authenticated";

revoke trigger on table "public"."inflation_data" from "authenticated";

revoke truncate on table "public"."inflation_data" from "authenticated";

revoke references on table "public"."investimentos" from "anon";

revoke trigger on table "public"."investimentos" from "anon";

revoke truncate on table "public"."investimentos" from "anon";

revoke references on table "public"."investimentos" from "authenticated";

revoke trigger on table "public"."investimentos" from "authenticated";

revoke truncate on table "public"."investimentos" from "authenticated";

revoke references on table "public"."metas" from "anon";

revoke trigger on table "public"."metas" from "anon";

revoke truncate on table "public"."metas" from "anon";

revoke references on table "public"."metas" from "authenticated";

revoke trigger on table "public"."metas" from "authenticated";

revoke truncate on table "public"."metas" from "authenticated";

revoke references on table "public"."recorrencia_parcelas" from "anon";

revoke trigger on table "public"."recorrencia_parcelas" from "anon";

revoke truncate on table "public"."recorrencia_parcelas" from "anon";

revoke references on table "public"."recorrencia_parcelas" from "authenticated";

revoke trigger on table "public"."recorrencia_parcelas" from "authenticated";

revoke truncate on table "public"."recorrencia_parcelas" from "authenticated";

revoke references on table "public"."recorrencias" from "anon";

revoke trigger on table "public"."recorrencias" from "anon";

revoke truncate on table "public"."recorrencias" from "anon";

revoke references on table "public"."recorrencias" from "authenticated";

revoke trigger on table "public"."recorrencias" from "authenticated";

revoke truncate on table "public"."recorrencias" from "authenticated";

revoke references on table "public"."transacoes" from "anon";

revoke trigger on table "public"."transacoes" from "anon";

revoke truncate on table "public"."transacoes" from "anon";

revoke references on table "public"."transacoes" from "authenticated";

revoke trigger on table "public"."transacoes" from "authenticated";

revoke truncate on table "public"."transacoes" from "authenticated";

revoke references on table "public"."transaction_types" from "anon";

revoke trigger on table "public"."transaction_types" from "anon";

revoke truncate on table "public"."transaction_types" from "anon";

revoke references on table "public"."transaction_types" from "authenticated";

revoke trigger on table "public"."transaction_types" from "authenticated";

revoke truncate on table "public"."transaction_types" from "authenticated";


