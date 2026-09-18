CREATE TABLE "tool_details" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"embed_url" varchar(2048) NOT NULL,
	"category" varchar(255),
	"instructions" text
);
--> statement-breakpoint
ALTER TABLE "tool_details" ADD CONSTRAINT "tool_details_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;