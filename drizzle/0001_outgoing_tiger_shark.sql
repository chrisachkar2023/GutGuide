-- Pre-auth rows have no email or password, so the NOT NULL columns below
-- cannot be added while they exist. The only such row is the seeded demo
-- profile, which `npm run db:setup` recreates as a real account along with
-- its history. Nothing a signed-up user created can be affected: this runs
-- before accounts existed.
DELETE FROM "meal_logs" WHERE "user_id" = 'demo-user';--> statement-breakpoint
DELETE FROM "symptom_logs" WHERE "user_id" = 'demo-user';--> statement-breakpoint
DELETE FROM "users" WHERE "id" = 'demo-user';--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");