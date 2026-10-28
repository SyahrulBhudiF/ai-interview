CREATE TABLE "cv_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"job_position" text NOT NULL,
	"experience_level" text NOT NULL,
	"job_description" text,
	"cv_text" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"model" text DEFAULT 'gemini-3.8-flash' NOT NULL,
	"report" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
