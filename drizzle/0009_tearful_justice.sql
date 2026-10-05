CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" text,
	"ip_address" varchar(45)
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "session_id" uuid;--> statement-breakpoint
INSERT INTO "auth_sessions" (
	"id",
	"user_id",
	"expires_at",
	"created_at",
	"revoked_at",
	"user_agent",
	"ip_address"
)
SELECT
	"id",
	"user_id",
	"expires_at",
	"created_at",
	"revoked_at",
	"user_agent",
	"ip_address"
FROM "refresh_tokens";--> statement-breakpoint
UPDATE "refresh_tokens" SET "session_id" = "id";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_active_idx" ON "auth_sessions" USING btree ("user_id","revoked_at");--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_auth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."auth_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens" USING btree ("session_id");--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP COLUMN "user_agent";--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP COLUMN "ip_address";
