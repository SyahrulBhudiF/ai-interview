import { InterviewsList } from "./components/interviews-list";
import { useInterviews } from "./hooks/use-interviews";

export function InterviewsPage() {
  const interviews = useInterviews();
  const count = interviews.data?.length;
  const ready = interviews.data?.filter((interview) => interview.status === "ready").length;

  return (
    <main className="page-shell max-w-5xl">
      <header className="space-y-3">
        <p className="eyebrow">Your practice room</p>
        <h1 className="page-heading">Interviews</h1>
        <p className="text-muted-foreground max-w-xl leading-relaxed">
          {interviews.error
            ? "Your saved interviews could not be loaded. Try refreshing the page."
            : count === undefined
              ? "Loading your interviews…"
              : count === 0
                ? "Pick a role to practise for. The questions come next."
                : `${count} saved interview${count === 1 ? "" : "s"}, ${ready} ready to practise. Open one to edit its questions or start a session.`}
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
