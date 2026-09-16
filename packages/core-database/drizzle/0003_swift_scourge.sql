CREATE TYPE "public"."project_status" AS ENUM('CONCEPT', 'PLANNING', 'DEVELOPMENT', 'COMPLETED', 'MAINTENANCE', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "project_details" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"problem" text,
	"solution" text,
	"technologies" text[] DEFAULT '{}' NOT NULL,
	"demo_url" varchar(2048),
	"repo_url" varchar(2048),
	"client_name" varchar(255),
	"start_date" date,
	"end_date" date,
	"project_status" "project_status" DEFAULT 'CONCEPT' NOT NULL,
	"results" text
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service_details" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"category_id" uuid,
	"features" text[] DEFAULT '{}' NOT NULL,
	"process" text[] DEFAULT '{}' NOT NULL,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cta_label" varchar(255),
	"cta_url" varchar(2048)
);
--> statement-breakpoint
CREATE TABLE "work_details" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"category" varchar(255),
	"technologies" text[] DEFAULT '{}' NOT NULL,
	"result" text,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"work_date" date
);
--> statement-breakpoint
ALTER TABLE "project_details" ADD CONSTRAINT "project_details_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_details" ADD CONSTRAINT "service_details_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_details" ADD CONSTRAINT "service_details_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_details" ADD CONSTRAINT "work_details_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;