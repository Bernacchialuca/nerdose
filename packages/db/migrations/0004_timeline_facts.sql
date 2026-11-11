CREATE TYPE "public"."date_precision" AS ENUM('year', 'month', 'day');--> statement-breakpoint
CREATE TYPE "public"."timeline_category" AS ENUM('programming_languages', 'frameworks', 'companies', 'operating_systems', 'hardware', 'video_games');--> statement-breakpoint
CREATE TABLE "timeline_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"category" timeline_category NOT NULL,
	"event_date" date NOT NULL,
	"date_precision" date_precision NOT NULL,
	"note" jsonb NOT NULL,
	"wikidata_id" text NOT NULL,
	"sitelinks" integer NOT NULL,
	"status" "bank_item_status" NOT NULL,
	"rejection_reason" text,
	"last_used" date,
	"dataset_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timeline_facts_wikidata_id_unique" UNIQUE("wikidata_id"),
	CONSTRAINT "ck_timeline_facts_rejection_reason" CHECK ("timeline_facts"."status" <> 'rejected' OR "timeline_facts"."rejection_reason" IS NOT NULL),
	CONSTRAINT "ck_timeline_facts_note_locales" CHECK ("timeline_facts"."note" ? 'es' AND "timeline_facts"."note" ? 'en')
);
--> statement-breakpoint
CREATE INDEX "idx_timeline_facts_pick" ON "timeline_facts" USING btree ("status","category","last_used");
--> statement-breakpoint
-- Drizzle no genera triggers: reutiliza las funciones genéricas de 0002 (nerdose-db.md, triggers).
CREATE TRIGGER bank_items_rejected_terminal BEFORE UPDATE OF status ON timeline_facts
  FOR EACH ROW EXECUTE FUNCTION bank_items_rejected_terminal();
--> statement-breakpoint
CREATE TRIGGER set_updated_at BEFORE UPDATE ON timeline_facts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
-- Drizzle no genera GRANT: permisos por tabla y columna según ADR-004.
GRANT SELECT ON timeline_facts TO nerdose_api;
--> statement-breakpoint
GRANT UPDATE (status, rejection_reason) ON timeline_facts TO nerdose_api;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON timeline_facts TO nerdose_generator;
