CREATE TABLE "follower_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"follower_count" integer NOT NULL,
	"following_count" integer,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"style" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"char_count" integer NOT NULL,
	"scheduled_post_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"is_manual" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"posted_at" timestamp,
	"error_message" text,
	"twitter_tweet_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"source_type" varchar(50) NOT NULL,
	"source_url" text,
	"file_path" text,
	"file_size" integer,
	"extracted_text" text NOT NULL,
	"word_count" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"twitter_user_id" varchar(255),
	"twitter_username" varchar(255),
	"twitter_access_token_encrypted" text,
	"twitter_refresh_token_encrypted" text,
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"post_frequency" integer DEFAULT 4 NOT NULL,
	"post_times" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "follower_stats" ADD CONSTRAINT "follower_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_posts" ADD CONSTRAINT "generated_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_posts" ADD CONSTRAINT "generated_posts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_posts" ADD CONSTRAINT "generated_posts_scheduled_post_id_posts_id_fk" FOREIGN KEY ("scheduled_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follower_stats_user_id_idx" ON "follower_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follower_stats_recorded_at_idx" ON "follower_stats" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "generated_posts_user_id_idx" ON "generated_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generated_posts_source_id_idx" ON "generated_posts" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "generated_posts_style_idx" ON "generated_posts" USING btree ("style");--> statement-breakpoint
CREATE INDEX "posts_user_id_idx" ON "posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "posts_scheduled_at_idx" ON "posts" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sources_user_id_idx" ON "sources" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sources_source_type_idx" ON "sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "sources_created_at_idx" ON "sources" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "twitter_user_id_idx" ON "users" USING btree ("twitter_user_id");