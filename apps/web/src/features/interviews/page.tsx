import { Link } from "@tanstack/react-router";

import { CreateInterviewForm } from "./components/create-interview-form";
import { InterviewsList } from "./components/interviews-list";
import { useInterviews } from "./hooks/use-interviews";

export function InterviewsPage() {
  const interviews = useInterviews();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Interviews</h1>
          <p className="text-muted-foreground text-sm">
            Create an interview, then generate and review its plan with Gemini.
          </p>
        </div>
        <Link to="/progress" className="text-sm underline underline-offset-4">
          View progress
        </Link>
      </header>
      <CreateInterviewForm />
      <section className="space-y-3">
        <h2 className="text-lg font-medium">All interviews</h2>
        <InterviewsList interviews={interviews.data} isPending={interviews.isPending} />
      </section>
    </main>
  );
}
