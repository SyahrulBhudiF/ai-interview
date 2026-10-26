ALTER TABLE "interviews" ADD COLUMN "allow_follow_ups" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "generate_detailed_feedback" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "strict_mode" boolean DEFAULT false NOT NULL;