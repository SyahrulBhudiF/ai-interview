import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ai-interview/ui/alert-dialog";
import { Badge } from "@ai-interview/ui/badge";
import { Button, buttonVariants } from "@ai-interview/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { cn } from "@ai-interview/ui/utils";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { AnswerComposer } from "./components/answer-composer";
import { CvPanel } from "./components/cv-panel";
import { TranscriptList } from "./components/transcript-list";
import { VoiceMode } from "./components/voice-mode";
import { useInterviewContext, useSessionDetail } from "./hooks/use-session";

export function InterviewLivePage({ sessionId }: { sessionId: string }) {
  const session = useSessionDetail(sessionId);
  const detail = session.data;
  const current = detail?.session;
  const { interview, plan } = useInterviewContext(current?.interviewId);

  const transcript = detail?.transcript ?? [];

  const totalQuestions =
    plan.data?.stages.reduce((count, stage) => count + stage.questions.length, 0) ?? 0;

  const askedQuestions = new Set(
    transcript
      .filter((entry) => entry.role === "ai" && entry.questionId)
      .map((entry) => entry.questionId),
  ).size;

  const answeredQuestions = new Set(
    transcript
      .filter((entry) => entry.role === "candidate" && entry.questionId)
      .map((entry) => entry.questionId),
  ).size;

  const questionNumber = Math.max(1, Math.min(askedQuestions, totalQuestions || askedQuestions));
  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const [answer, setAnswer] = useState("");

  const submitAnswer = () => {
    const text = answer.trim();
    if (!text || session.answer.isPending) return;
    session.answer.mutate(text, { onSuccess: () => setAnswer("") });
  };

  const status = current?.status;
  const interviewData = interview.data;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Session
            </p>
            <h1 className="font-serif text-4xl tracking-tight">
              {interviewData?.title ?? "Live interview"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {interviewData
                ? `${interviewData.jobPosition} · ${interviewData.experienceLevel} · ${interviewData.difficulty}`
                : "Preparing the room…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status ? (
              <Badge variant={status === "completed" ? "secondary" : "default"}>{status}</Badge>
            ) : null}
            {status === "in_progress" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={session.end.isPending}>
                    {session.end.isPending ? "Ending…" : "End interview"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End this interview?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The session stops here and the transcript is kept. You can evaluate it from
                      the results page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep going</AlertDialogCancel>
                    <AlertDialogAction
                      className={buttonVariants({ variant: "destructive" })}
                      onClick={() => session.end.mutate()}
                    >
                      End interview
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            {status === "completed" ? (
              <Button asChild>
                <Link to="/sessions/$sessionId/results" params={{ sessionId }}>
                  View results
                </Link>
              </Button>
            ) : null}
          </div>
        </header>
      </div>

      {session.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : !current ? (
        <Card>
          <CardHeader>
            <CardTitle>Session not found</CardTitle>
            <CardDescription>This interview session could not be loaded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/interviews">Back to interviews</Link>
            </Button>
          </CardContent>
        </Card>
      ) : status === "created" ? (
        <Card>
          <CardHeader>
            <CardTitle>Ready when you are</CardTitle>
            <CardDescription>
              Start the session and the interviewer asks the first question.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => session.start.mutate()} disabled={session.start.isPending}>
              {session.start.isPending ? "Starting…" : "Start interview"}
            </Button>
          </CardContent>
        </Card>
      ) : status === "in_progress" ? (
        <div
          className={cn(
            "grid gap-6",
            interviewData?.cvText ? "lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start" : undefined,
          )}
        >
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {totalQuestions > 0
                      ? `Question ${questionNumber} of ${totalQuestions}`
                      : "Interview in progress"}
                  </p>
                  {totalQuestions > 0 ? (
                    <p className="text-muted-foreground text-xs tabular-nums">{progress}%</p>
                  ) : null}
                </div>
                {totalQuestions > 0 ? (
                  <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden>
                    <div
                      className="bg-primary h-full rounded-full transition-[width]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {interviewData?.cvText ? (
              <CvPanel cvText={interviewData.cvText} collapsible className="lg:hidden" />
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
                <CardDescription>
                  Answers are saved to the transcript and used for the debrief.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptList transcript={transcript} pending={session.answer.isPending} />
              </CardContent>
              <CardFooter>
                <AnswerComposer
                  value={answer}
                  onChange={setAnswer}
                  onSubmit={submitAnswer}
                  pending={session.answer.isPending}
                />
              </CardFooter>
            </Card>

            <VoiceMode sessionId={sessionId} />
          </div>

          {interviewData?.cvText ? (
            <CvPanel
              cvText={interviewData.cvText}
              className="hidden lg:sticky lg:top-24 lg:block"
            />
          ) : null}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="bg-secondary text-secondary-foreground grid size-10 shrink-0 place-items-center rounded-full">
                  <CheckCircle2 aria-hidden className="size-5" />
                </span>
                <div className="space-y-1">
                  <CardTitle>
                    {status === "completed" ? "Interview complete" : `Session ${status}`}
                  </CardTitle>
                  <CardDescription>
                    The transcript is saved. Open the results to generate the debrief.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/sessions/$sessionId/results" params={{ sessionId }}>
                  Open results
                </Link>
              </Button>
              {current.interviewId ? (
                <Button asChild variant="outline">
                  <Link to="/interviews/$interviewId" params={{ interviewId: current.interviewId }}>
                    Back to interview
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <TranscriptList transcript={transcript} pending={false} />
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
