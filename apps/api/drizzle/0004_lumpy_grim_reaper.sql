ALTER TABLE "transcript_entries" DROP CONSTRAINT "transcript_entries_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "transcript_entries" ADD CONSTRAINT "transcript_entries_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;