CREATE TABLE IF NOT EXISTS "public"."monetary_aggregates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period" "text" NOT NULL,
    "value" numeric NOT NULL,
    "data_source" "text" DEFAULT 'BCB_M2'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."monetary_aggregates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."monetary_aggregates"
    ADD CONSTRAINT "monetary_aggregates_period_key" UNIQUE ("period");


ALTER TABLE ONLY "public"."monetary_aggregates"
    ADD CONSTRAINT "monetary_aggregates_pkey" PRIMARY KEY ("id");


CREATE INDEX "idx_monetary_aggregates_period" ON "public"."monetary_aggregates" USING "btree" ("period");


CREATE INDEX "idx_monetary_aggregates_updated_at" ON "public"."monetary_aggregates" USING "btree" ("updated_at");


ALTER TABLE "public"."monetary_aggregates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated users to read monetary aggregates" ON "public"."monetary_aggregates" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Allow service role to manage monetary aggregates" ON "public"."monetary_aggregates" TO "service_role" USING (true);


GRANT ALL ON TABLE "public"."monetary_aggregates" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monetary_aggregates" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."monetary_aggregates" TO "anon";


revoke references on table "public"."monetary_aggregates" from "anon";
revoke trigger on table "public"."monetary_aggregates" from "anon";
revoke truncate on table "public"."monetary_aggregates" from "anon";
revoke references on table "public"."monetary_aggregates" from "authenticated";
revoke trigger on table "public"."monetary_aggregates" from "authenticated";
revoke truncate on table "public"."monetary_aggregates" from "authenticated";
