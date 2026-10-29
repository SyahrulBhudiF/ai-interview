import { Link } from "@tanstack/react-router";

import { InterviewForm } from "@/features/interviews/components/interview-form";

export function NewInterviewPage() {
  return (
    <main className="page-shell max-w-3xl">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        <header className="space-y-3 pt-2">
          <p className="eyebrow">First, the role</p>
          <h1 className="page-heading">What are you applying for?</h1>
          <p className="text-muted-foreground max-w-xl leading-relaxed">
            Give the interviewer some context. After saving, you'll build the question plan and
            choose what to practise.
          </p>
        </header>
      </div>
      <InterviewForm />
    </main>
  );
}
