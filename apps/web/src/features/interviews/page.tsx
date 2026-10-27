import { InterviewsList } from "./components/interviews-list";
import { useInterviews } from "./hooks/use-interviews";

export function InterviewsPage() {
  const interviews = useInterviews();
  const count = interviews.data?.length;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Workspace</p>
        <h1 className="font-serif text-4xl tracking-tight">Interviews</h1>
        <p className="text-muted-foreground max-w-xl">
          {count === undefined
            ? "Loading your interviews…"
            : count === 0
              ? "No interviews yet. Build one to generate a plan and rehearse."
              : `${count} interview${count === 1 ? "" : "s"} ready to rehearse.`}
        </p>
      </header>
      <InterviewsList
        interviews={interviews.data}
        isPending={interviews.isPending}
        error={interviews.error}
      />
    </main>
  );
}
