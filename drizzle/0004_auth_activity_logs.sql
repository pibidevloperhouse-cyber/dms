CREATE TABLE IF NOT EXISTS "auth_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"event_type" text NOT NULL,
	"status" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"failure_reason" text,
	"company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_activity_logs" ADD CONSTRAINT "auth_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_activity_logs" ADD CONSTRAINT "auth_activity_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
