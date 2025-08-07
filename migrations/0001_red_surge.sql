CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"performed_by" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"job_role" text NOT NULL,
	"skillset" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"candidate_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "question_bank" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"question_text" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"tokens" integer NOT NULL,
	"cost" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "disqualified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "invited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_role" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;