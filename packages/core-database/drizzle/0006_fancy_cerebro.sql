CREATE TYPE "public"."ai_request_status" AS ENUM('SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TABLE "ai_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"prompt_key" varchar(100),
	"prompt" text NOT NULL,
	"result_text" text,
	"result_ref" varchar(255),
	"tokens_used" integer,
	"status" "ai_request_status" NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;