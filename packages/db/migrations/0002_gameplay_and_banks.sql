CREATE TYPE "public"."bank_item_status" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."challenge_status" AS ENUM('draft', 'approved', 'published', 'rejected', 'voided');--> statement-breakpoint
CREATE TYPE "public"."game_id" AS ENUM('devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt');--> statement-breakpoint
CREATE TYPE "public"."job_run_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."play_status" AS ENUM('in_progress', 'won', 'lost', 'voided');--> statement-breakpoint
CREATE TYPE "public"."term_category" AS ENUM('programming_languages', 'git', 'databases', 'networking', 'linux', 'apis', 'security', 'software_engineering');--> statement-breakpoint
CREATE TABLE "terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" text NOT NULL,
	"category" "term_category" NOT NULL,
	"definition" jsonb NOT NULL,
	"summary" jsonb NOT NULL,
	"example" jsonb,
	"wikidata_id" text NOT NULL,
	"sitelinks" integer NOT NULL,
	"status" "bank_item_status" NOT NULL,
	"rejection_reason" text,
	"last_used_devdle" date,
	"last_used_grep" date,
	"dataset_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "terms_term_unique" UNIQUE("term"),
	CONSTRAINT "terms_wikidata_id_unique" UNIQUE("wikidata_id"),
	CONSTRAINT "ck_terms_term_format" CHECK ("terms"."term" ~ '^[A-Z]{4,12}$'),
	CONSTRAINT "ck_terms_rejection_reason" CHECK ("terms"."status" <> 'rejected' OR "terms"."rejection_reason" IS NOT NULL),
	CONSTRAINT "ck_terms_definition_locales" CHECK ("terms"."definition" ? 'es' AND "terms"."definition" ? 'en'),
	CONSTRAINT "ck_terms_summary_locales" CHECK ("terms"."summary" ? 'es' AND "terms"."summary" ? 'en')
);
--> statement-breakpoint
CREATE TABLE "plays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"game_id" "game_id" NOT NULL,
	"date" date NOT NULL,
	"state" jsonb NOT NULL,
	"status" "play_status" DEFAULT 'in_progress' NOT NULL,
	"result" jsonb,
	"code_language" "code_language",
	"score" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "ck_plays_result_when_finished" CHECK ("plays"."status" NOT IN ('won','lost') OR "plays"."result" IS NOT NULL),
	CONSTRAINT "ck_plays_finished_at" CHECK ("plays"."status" = 'in_progress' OR "plays"."finished_at" IS NOT NULL),
	CONSTRAINT "ck_plays_code_language_game" CHECK ("plays"."code_language" IS NULL OR "plays"."game_id" IN ('big-o','bug-hunt'))
);
--> statement-breakpoint
CREATE TABLE "rejected_guesses" (
	"word" text NOT NULL,
	"player_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rejected_guesses_word_player_id_pk" PRIMARY KEY("word","player_id"),
	CONSTRAINT "ck_rejected_guesses_word" CHECK ("rejected_guesses"."word" ~ '^[A-Z]+$')
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" "game_id" NOT NULL,
	"date" date NOT NULL,
	"number" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "challenge_status" DEFAULT 'draft' NOT NULL,
	"generator_version" text NOT NULL,
	"seed" text NOT NULL,
	"attempt" integer NOT NULL,
	"verification" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"void_reason" text,
	"voided_at" timestamp with time zone,
	"alert_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_challenges_number_positive" CHECK ("challenges"."number" >= 1),
	CONSTRAINT "ck_challenges_voided_reason" CHECK ("challenges"."status" <> 'voided' OR ("challenges"."void_reason" IS NOT NULL AND "challenges"."voided_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "player_game_stats" (
	"player_id" uuid NOT NULL,
	"game_id" "game_id" NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"last_completed_date" date,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "player_game_stats_player_id_game_id_pk" PRIMARY KEY("player_id","game_id"),
	CONSTRAINT "ck_player_game_stats_non_negative" CHECK ("player_game_stats"."current_streak" >= 0 AND "player_game_stats"."max_streak" >= 0 AND "player_game_stats"."played" >= 0 AND "player_game_stats"."wins" >= 0),
	CONSTRAINT "ck_player_game_stats_max_streak" CHECK ("player_game_stats"."max_streak" >= "player_game_stats"."current_streak")
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"player_id" uuid PRIMARY KEY NOT NULL,
	"global_streak" integer DEFAULT 0 NOT NULL,
	"max_global_streak" integer DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"total_completed" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ck_player_stats_non_negative" CHECK ("player_stats"."global_streak" >= 0 AND "player_stats"."max_global_streak" >= 0 AND "player_stats"."total_completed" >= 0),
	CONSTRAINT "ck_player_stats_max_streak" CHECK ("player_stats"."max_global_streak" >= "player_stats"."global_streak")
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" text NOT NULL,
	"status" "job_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rejected_guesses" ADD CONSTRAINT "rejected_guesses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_game_stats" ADD CONSTRAINT "player_game_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_terms_devdle_pick" ON "terms" USING btree ("status","category","last_used_devdle");--> statement-breakpoint
CREATE INDEX "idx_terms_grep_pick" ON "terms" USING btree ("status","last_used_grep");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_plays_player_challenge" ON "plays" USING btree ("player_id","challenge_id");--> statement-breakpoint
CREATE INDEX "idx_plays_player_date" ON "plays" USING btree ("player_id","date");--> statement-breakpoint
CREATE INDEX "idx_plays_player_game_date" ON "plays" USING btree ("player_id","game_id","date");--> statement-breakpoint
CREATE INDEX "idx_plays_challenge_status" ON "plays" USING btree ("challenge_id","status");--> statement-breakpoint
CREATE INDEX "idx_plays_date" ON "plays" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_challenges_active_game_date" ON "challenges" USING btree ("game_id","date") WHERE "challenges"."status" IN ('approved','published','voided');--> statement-breakpoint
CREATE INDEX "idx_challenges_game_date_status" ON "challenges" USING btree ("game_id","date","status");--> statement-breakpoint
CREATE INDEX "idx_challenges_date_status" ON "challenges" USING btree ("date","status");--> statement-breakpoint
CREATE INDEX "idx_player_stats_global_streak" ON "player_stats" USING btree ("global_streak");--> statement-breakpoint
CREATE INDEX "idx_job_runs_job_started_at" ON "job_runs" USING btree ("job","started_at");--> statement-breakpoint
-- Drizzle no genera triggers: invariantes de challenges (nerdose-db.md, invariante 2 y ciclo de vida).
CREATE FUNCTION challenges_payload_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('approved','published','voided')
     AND (NEW.payload IS DISTINCT FROM OLD.payload
          OR NEW.seed IS DISTINCT FROM OLD.seed
          OR NEW.attempt IS DISTINCT FROM OLD.attempt) THEN
    RAISE EXCEPTION 'challenges_payload_immutable: payload, seed and attempt cannot change once approved';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER challenges_payload_immutable BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION challenges_payload_immutable();
--> statement-breakpoint
CREATE FUNCTION challenges_status_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF (OLD.status, NEW.status) IN (('draft','approved'), ('draft','rejected'),
      ('approved','published'), ('approved','rejected'), ('published','voided')) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'challenges_status_transition: invalid transition % -> %', OLD.status, NEW.status;
END $$;
--> statement-breakpoint
CREATE TRIGGER challenges_status_transition BEFORE UPDATE OF status ON challenges
  FOR EACH ROW EXECUTE FUNCTION challenges_status_transition();
--> statement-breakpoint
-- Funciones genéricas: las tablas de otras stories solo agregan su CREATE TRIGGER.
CREATE FUNCTION bank_items_rejected_terminal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'rejected' AND NEW.status <> 'rejected' THEN
    RAISE EXCEPTION 'bank_items_rejected_terminal: a rejected item cannot leave rejected';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER bank_items_rejected_terminal BEFORE UPDATE OF status ON terms
  FOR EACH ROW EXECUTE FUNCTION bank_items_rejected_terminal();
--> statement-breakpoint
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER set_updated_at BEFORE UPDATE ON terms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
-- Drizzle no genera GRANT: permisos por tabla y columna según ADR-004 (nerdose-db.md l. 489-503).
GRANT SELECT, INSERT, UPDATE ON plays, player_game_stats, player_stats, rejected_guesses TO nerdose_api;
--> statement-breakpoint
GRANT SELECT ON challenges TO nerdose_api;
--> statement-breakpoint
GRANT UPDATE (status, void_reason, voided_at, alert_sent_at) ON challenges TO nerdose_api;
--> statement-breakpoint
GRANT SELECT ON terms TO nerdose_api;
--> statement-breakpoint
GRANT UPDATE (status, rejection_reason) ON terms TO nerdose_api;
--> statement-breakpoint
GRANT SELECT ON job_runs TO nerdose_api;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON challenges, terms, job_runs TO nerdose_generator;
