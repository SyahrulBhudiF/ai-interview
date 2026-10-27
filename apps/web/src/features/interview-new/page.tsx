import { Link } from "@tanstack/react-router";

import { InterviewForm } from "@/features/interviews/components/interview-form";

export function NewInterviewPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        <header className="space-y-2">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">New</p>
          <h1 className="font-serif text-4xl tracking-tight">Set up an interview</h1>
          <p className="text-muted-foreground max-w-xl">
            Pick the role and constraints. Generate a plan with Gemini once the interview exists.
          </p>
        </header>
      </div>
      <InterviewForm />
    </main>
  );
}
