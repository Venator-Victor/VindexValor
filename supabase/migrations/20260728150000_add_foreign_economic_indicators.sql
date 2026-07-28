-- Generic holder for foreign (non-BCB) money-supply and price-index series,
-- e.g. FRED's M2SL and CPIAUCSL for the US. Keeping this separate from
-- monetary_aggregates/inflation_data (Brazil-specific, already consumed by
-- other cards) avoids touching their established unique-key contracts.
CREATE TABLE IF NOT EXISTS "public"."foreign_economic_indicators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country" "text" NOT NULL,
    "indicator" "text" NOT NULL,
    "period" "text" NOT NULL,
    "value" numeric NOT NULL,
    "data_source" "text" DEFAULT 'FRED'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."foreign_economic_indicators" OWNER TO "postgres";


ALTER TABLE ONLY "public"."foreign_economic_indicators"
    ADD CONSTRAINT "foreign_economic_indicators_country_indicator_period_key" UNIQUE ("country", "indicator", "period");


ALTER TABLE ONLY "public"."foreign_economic_indicators"
    ADD CONSTRAINT "foreign_economic_indicators_pkey" PRIMARY KEY ("id");


CREATE INDEX "idx_foreign_economic_indicators_lookup" ON "public"."foreign_economic_indicators" USING "btree" ("country", "indicator", "period");


ALTER TABLE "public"."foreign_economic_indicators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated users to read foreign economic indicators" ON "public"."foreign_economic_indicators" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Allow service role to manage foreign economic indicators" ON "public"."foreign_economic_indicators" TO "service_role" USING (true);


GRANT ALL ON TABLE "public"."foreign_economic_indicators" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."foreign_economic_indicators" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."foreign_economic_indicators" TO "anon";


revoke references on table "public"."foreign_economic_indicators" from "anon";
revoke trigger on table "public"."foreign_economic_indicators" from "anon";
revoke truncate on table "public"."foreign_economic_indicators" from "anon";
revoke references on table "public"."foreign_economic_indicators" from "authenticated";
revoke trigger on table "public"."foreign_economic_indicators" from "authenticated";
revoke truncate on table "public"."foreign_economic_indicators" from "authenticated";
