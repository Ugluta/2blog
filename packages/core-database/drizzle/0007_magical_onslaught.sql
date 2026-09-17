CREATE INDEX "sessions_family_idx" ON "sessions" USING btree ("family");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contents_status_idx" ON "contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contents_type_key_idx" ON "contents" USING btree ("type_key");--> statement-breakpoint
CREATE INDEX "content_revisions_content_id_idx" ON "content_revisions" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "content_categories_category_id_idx" ON "content_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "content_tags_tag_id_idx" ON "content_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "media_owner_id_idx" ON "media" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "service_details_category_id_idx" ON "service_details" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "scraper_rules_source_id_idx" ON "scraper_rules" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "crawl_jobs_source_id_idx" ON "crawl_jobs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "raw_data_items_crawl_job_id_idx" ON "raw_data_items" USING btree ("crawl_job_id");--> statement-breakpoint
CREATE INDEX "data_pool_items_status_idx" ON "data_pool_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "data_pool_items_source_id_idx" ON "data_pool_items" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "ai_requests_user_id_idx" ON "ai_requests" USING btree ("user_id");