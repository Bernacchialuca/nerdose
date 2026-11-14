CREATE TYPE "public"."generation_request_status" AS ENUM('pending', 'done', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "generation_failures" (
	"game_id" "game_id" NOT NULL,
	"date" date NOT NULL,
	"attempts" integer NOT NULL,
	"last_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generation_failures_game_id_date_pk" PRIMARY KEY("game_id","date"),
	CONSTRAINT "ck_generation_failures_attempts" CHECK ("generation_failures"."attempts" >= 1)
);
--> statement-breakpoint
CREATE TABLE "generation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"status" "generation_request_status" DEFAULT 'pending' NOT NULL,
	"new_challenge_id" uuid,
	"error" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "ck_generation_requests_done_new_challenge" CHECK ("generation_requests"."status" <> 'done' OR "generation_requests"."new_challenge_id" IS NOT NULL),
	CONSTRAINT "ck_generation_requests_processed_at" CHECK ("generation_requests"."status" = 'pending' OR "generation_requests"."processed_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_new_challenge_id_challenges_id_fk" FOREIGN KEY ("new_challenge_id") REFERENCES "public"."challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_generation_requests_pending" ON "generation_requests" USING btree ("challenge_id") WHERE "generation_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_generation_requests_status" ON "generation_requests" USING btree ("status","requested_at");--> statement-breakpoint
CREATE INDEX "idx_generation_requests_challenge" ON "generation_requests" USING btree ("challenge_id","requested_at");
--> statement-breakpoint
-- Drizzle no genera triggers: updated_at lo mantiene set_updated_at() de 0002, también en el UPSERT de fill (ADR-017).
CREATE TRIGGER set_updated_at BEFORE UPDATE ON generation_failures
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
-- Drizzle no genera GRANT: la api encola y lee; el generator atiende la cola y registra fallas; nadie borra (ADR-004).
GRANT SELECT, INSERT ON generation_requests TO nerdose_api;
--> statement-breakpoint
GRANT SELECT ON generation_failures TO nerdose_api;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON generation_requests, generation_failures TO nerdose_generator;
