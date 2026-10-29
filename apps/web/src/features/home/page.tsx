import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowRight, RotateCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { useInterviews } from "@/features/interviews/hooks/use-interviews";
import { useProgress } from "@/features/progress/hooks/use-progress";

const questions = [
  "Tell me about a technical decision you would make differently today. What changed your mind?",
  "A deadline moves forward by a week. How do you decide what stays in scope?",
  "You disagree with a teammate's approach. How do you move the work forward?",
];

export function HomePage() {
  const interviews = useInterviews();
  const progress = useProgress();
  const recent = interviews.data?.slice(0, 4) ?? [];
  const summary = progress.data?.summary;
  const [question, setQuestion] = useState(0);
  const reducedMotion = useReducedMotion();

  return (
    <main className="page-shell max-w-6xl gap-10 sm:gap-12">
      <section className="grid items-start gap-8 py-2 sm:py-4 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="space-y-6 lg:py-4">
          <p className="eyebrow">Before the real interview</p>
          <h1 className="text-[clamp(2.75rem,5vw,4.5rem)]">
            Make your next
            <span className="text-primary block">answer clearer.</span>
          </h1>
          <p className="text-muted-foreground max-w-md text-base leading-relaxed">
            Build a question plan for the role you want. Answer out loud with a Gemini interviewer,
            then use your transcript and debrief to prepare for the next round.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="h-11">
              <Link to="/interviews/new">
                Set up an interview <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-11">
              <Link to="/cv-reviews">Review your CV</Link>
            </Button>
          </div>
        </div>
        <div className="bg-secondary/75 text-secondary-foreground flex min-w-0 flex-col rounded-4xl p-6 sm:p-8">
          <div className="text-primary flex items-center justify-between gap-4 text-xs font-medium">
            <p>Sample question</p>
            <span aria-hidden className="tabular-nums">
              0{question + 1} / 0{questions.length}
            </span>
          </div>
          <div aria-live="polite" aria-atomic="true" className="my-7 min-h-40 sm:min-h-36">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={question}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
                transition={{ duration: reducedMotion ? 0 : 0.16 }}
                className="text-2xl leading-snug font-medium tracking-tight sm:text-3xl"
              >
                {questions[question]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="border-primary/15 flex flex-wrap items-end justify-between gap-5 border-t pt-5">
            <p className="max-w-52 text-xs leading-relaxed">
              Your interview uses the role, job description, and CV you add.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="bg-card/70 hover:bg-card dark:hover:bg-card"
              onClick={() => setQuestion((current) => (current + 1) % questions.length)}
            >
              <RotateCw aria-hidden /> Another question
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="practice-log"
        className="bg-card flex flex-wrap items-center justify-between gap-6 rounded-3xl px-6 py-5 sm:px-8"
      >
        <div className="space-y-1">
          <h2 id="practice-log" className="text-sm">
            Practice so far
          </h2>
          <Link
            to="/progress"
            className="text-primary text-xs font-medium underline underline-offset-4"
          >
            See your scores
          </Link>
        </div>
        {progress.isPending ? (
          <Skeleton className="h-12 w-64 max-w-full" />
        ) : progress.error ? (
          <p role="alert" className="text-destructive text-sm">
            Could not load your progress.
          </p>
        ) : (
          <dl className="grid grid-cols-3 gap-6 sm:gap-12">
            <Stat label="Interviews" value={summary?.interviews ?? 0} />
            <Stat label="Sessions" value={summary?.sessions ?? 0} />
            <Stat label="Avg / 100" value={summary?.averageScore ?? "—"} />
          </dl>
        )}
      </section>

      <motion.section
        initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl">Your interview plans</h2>
          <Link to="/interviews" className="text-primary shrink-0 text-sm font-medium">
            View all →
          </Link>
        </div>
        {interviews.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : interviews.error ? (
          <p role="alert" className="text-destructive text-sm">
            Could not load your interviews. {interviews.error.message}
          </p>
        ) : recent.length === 0 ? (
          <div className="bg-secondary/50 rounded-3xl p-6">
            <p className="font-medium">What role are you preparing for?</p>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
              Start with the job title. You can edit every question before the interview begins.
            </p>
            <Link
              to="/interviews/new"
              className="text-primary mt-4 inline-block text-sm font-medium underline underline-offset-4"
            >
              Create your first interview
            </Link>
          </div>
        ) : (
          <div className="bg-card divide-border/50 divide-y overflow-hidden rounded-3xl">
            {recent.map((interview, index) => (
              <Link
                key={interview.id}
                to="/interviews/$interviewId"
                params={{ interviewId: interview.id }}
                className="hover:bg-secondary/40 grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-5 transition-colors sm:grid-cols-[2rem_minmax(0,1fr)_auto_2rem] sm:gap-5 sm:px-6"
              >
                <span
                  aria-hidden
                  className="bg-secondary/60 text-primary hidden size-8 place-items-center rounded-full text-xs tabular-nums sm:grid"
                >
                  0{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{interview.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                    {interview.jobPosition} · {interview.experienceLevel}
                  </p>
                </div>
                <Badge variant={interview.status === "ready" ? "default" : "secondary"}>
                  {interview.status === "ready" ? "Ready" : "Draft"}
                </Badge>
                <ArrowRight
                  aria-hidden
                  className="text-primary hidden size-4 justify-self-end sm:block"
                />
              </Link>
            ))}
          </div>
        )}
      </motion.section>

      <section className="grid gap-8 pt-2 sm:grid-cols-3">
        {[
          [
            "Set the role",
            "Add the job description and, if you want, your CV. Generate a question plan and edit it before you start.",
          ],
          [
            "Work through the questions",
            "Type your answers. Follow-ups can ask you to explain the parts you skipped. Your transcript is saved.",
          ],
          [
            "Find the answer to revisit",
            "Generate a debrief with rubric scores and reasons behind the feedback. Practise a weaker skill from your progress page.",
          ],
        ].map(([title, body], index) => (
          <div key={title}>
            <p className="bg-secondary text-primary mb-4 grid size-8 place-items-center rounded-full text-xs tabular-nums">
              0{index + 1}
            </p>
            <h2 className="text-sm">{title}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
