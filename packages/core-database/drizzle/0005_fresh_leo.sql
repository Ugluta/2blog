CREATE TYPE "public"."crawl_job_status" AS ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."data_pool_status" AS ENUM('PROCESSED', 'REJECTED', 'READY', 'PUBLISHED');--> statement-breakpoint
CREATE TABLE "scraper_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_url" varchar(2048) NOT NULL,
	"list_url" varchar(2048) NOT NULL,
	"list_item_selector" varchar(500) NOT NULL,
	"type_key" varchar(50) DEFAULT 'post' NOT NULL,
	"schedule_cron" varchar(100),
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraper_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"title_selector" varchar(500) NOT NULL,
	"body_selector" varchar(500) NOT NULL,
	"excerpt_selector" varchar(500),
	"cover_image_selector" varchar(500),
	"cover_image_attr" varchar(50) DEFAULT 'src' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"status" "crawl_job_status" DEFAULT 'PENDING' NOT NULL,
	"items_found" integer DEFAULT 0 NOT NULL,
	"items_new" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"triggered_by" uuid,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_data_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crawl_job_id" uuid NOT NULL,
	"source_url" varchar(2048) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"raw_title" text,
	"raw_body" text,
	"raw_excerpt" text,
	"raw_cover_image" varchar(2048),
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_data_items_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "data_pool_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_data_item_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"type_key" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255),
	"excerpt" text,
	"body" text,
	"cover_image" varchar(2048),
	"status" "data_pool_status" DEFAULT 'PROCESSED' NOT NULL,
	"content_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_pool_items_raw_data_item_id_unique" UNIQUE("raw_data_item_id")
);
--> statement-breakpoint
ALTER TABLE "scraper_rules" ADD CONSTRAINT "scraper_rules_source_id_scraper_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."scraper_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_source_id_scraper_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."scraper_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_rule_id_scraper_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."scraper_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_data_items" ADD CONSTRAINT "raw_data_items_crawl_job_id_crawl_jobs_id_fk" FOREIGN KEY ("crawl_job_id") REFERENCES "public"."crawl_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_pool_items" ADD CONSTRAINT "data_pool_items_raw_data_item_id_raw_data_items_id_fk" FOREIGN KEY ("raw_data_item_id") REFERENCES "public"."raw_data_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_pool_items" ADD CONSTRAINT "data_pool_items_source_id_scraper_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."scraper_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_pool_items" ADD CONSTRAINT "data_pool_items_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_pool_items" ADD CONSTRAINT "data_pool_items_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;