CREATE TYPE "public"."code_language" AS ENUM('js', 'go', 'java');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('es', 'en');--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" "locale" DEFAULT 'es' NOT NULL,
	"preferred_code_language" "code_language" DEFAULT 'js' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_players_created_at" ON "players" USING btree ("created_at");--> statement-breakpoint
-- Drizzle no genera GRANT: permisos por tabla explícitos según ADR-004; el rol del generator queda sin acceso.
GRANT SELECT, INSERT, UPDATE ON players TO nerdose_api;
