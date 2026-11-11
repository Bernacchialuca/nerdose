CREATE TYPE "public"."report_reason" AS ENUM('wrong_answer', 'ambiguous', 'wrong_explanation', 'translation', 'display_bug', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "challenge_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"message" text,
	"locale" "locale" NOT NULL,
	"context" jsonb NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_reports_message_length" CHECK ("challenge_reports"."message" IS NULL OR char_length("challenge_reports"."message") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "challenge_reports" ADD CONSTRAINT "challenge_reports_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_reports" ADD CONSTRAINT "challenge_reports_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reports_player_challenge" ON "challenge_reports" USING btree ("player_id","challenge_id");--> statement-breakpoint
CREATE INDEX "idx_reports_challenge_status" ON "challenge_reports" USING btree ("challenge_id","status");--> statement-breakpoint
CREATE INDEX "idx_reports_challenge_reason" ON "challenge_reports" USING btree ("challenge_id","reason");--> statement-breakpoint
CREATE INDEX "idx_reports_status_created_at" ON "challenge_reports" USING btree ("status","created_at");
--> statement-breakpoint
-- Drizzle no genera triggers: resolved y dismissed son terminales (nerdose-db.md, triggers; REQ-007 CA 16).
CREATE FUNCTION challenge_reports_status_terminal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'open' AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'challenge_reports_status_terminal: resolved and dismissed are terminal';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER challenge_reports_status_terminal BEFORE UPDATE OF status ON challenge_reports
  FOR EACH ROW EXECUTE FUNCTION challenge_reports_status_terminal();
--> statement-breakpoint
-- Drizzle no genera GRANT: solo la api escribe reportes; el generator no tiene acceso (ADR-004).
GRANT SELECT, INSERT, UPDATE ON challenge_reports TO nerdose_api;
