CREATE TABLE "meal_logs" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"food_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"portion" text DEFAULT 'regular' NOT NULL,
	"notes" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_logs_id_logged_at_pk" PRIMARY KEY("id","logged_at")
);
--> statement-breakpoint
CREATE TABLE "symptom_logs" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"pain" real NOT NULL,
	"bloating" real NOT NULL,
	"energy" real NOT NULL,
	"urgency" real NOT NULL,
	"notes" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "symptom_logs_id_logged_at_pk" PRIMARY KEY("id","logged_at")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"diagnosed_year" integer NOT NULL,
	"phase" text DEFAULT 'remission' NOT NULL,
	"restrictions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"watch_traits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"favorite_cuisines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dislikes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "meal_logs_user_time_idx" ON "meal_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "symptom_logs_user_time_idx" ON "symptom_logs" USING btree ("user_id","logged_at");