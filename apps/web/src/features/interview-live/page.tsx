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

import { CvPanel } from "@/components/cv-panel";

import { AnswerComposer } from "./components/answer-composer";
import { TranscriptList } from "./components/transcript-list";
import { VoiceMode } from "./components/voice-mode";
import { useRealtimeInterview } from "./hooks/use-realtime";
import { useInterviewContext, useSessionDetail } from "./hooks/use-session";

export function InterviewLivePage({ sessionId }: { sessionId: string }) {
  const session = useSessionDetail(sessionId);
  const voice = useRealtimeInterview(sessionId);
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
  const [useText, setUseText] = useState(false);
  const currentPrompt = transcript.at(-1);

  const submitAnswer = () => {
    const text = answer.trim();
    if (!text || !currentPrompt || session.answer.isPending) return;
    session.answer.mutate({ text, replyTo: currentPrompt.id }, { onSuccess: () => setAnswer("") });
  };

  const startVoiceInterview = async () => {
    const result = await session.start.mutateAsync();
    if (result.session.status !== "in_progress") return;
    const refreshed = await session.refetch();
    const prompt = refreshed.data?.transcript.at(-1);
    if (prompt) await voice.connect(prompt.id);
  };

  const switchToText = async () => {
    setAnswer(voice.takeDraft() || answer);
    await voice.disconnect();
    setUseText(true);
  };

  const endInterview = async () => {
    const result = voice.candidateText ? await voice.retrySave() : undefined;
    if (voice.candidateText && !result) return;
    await voice.disconnect();
    if (!result?.finished) session.end.mutate();
  };

  const status = current?.status;
  const interviewData = interview.data;

  return (
    <main className="page-shell max-w-6xl gap-6">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">One question at a time</p>
            <h1 className="page-heading">{interviewData?.title ?? "Live interview"}</h1>
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
                  <Button
                    variant="outline"
                    disabled={session.end.isPending || voice.saving || session.answer.isPending}
                  >
                    {session.end.isPending ? "Ending…" : "End interview"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End this interview?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your current spoken answer will be saved before the interview ends. Unsent
                      typed text is not included. You can then open your debrief.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep going</AlertDialogCancel>
                    <AlertDialogAction
                      className={buttonVariants({ variant: "destructive" })}
                      onClick={() => void endInterview()}
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
            <CardTitle>Step into your interview</CardTitle>
            <CardDescription>
              Find a quiet spot and put on your headphones. Your interviewer will ask questions
              aloud. Answer through your microphone, just as you would in an interview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => void startVoiceInterview().catch(() => {})}
              disabled={session.start.isPending}
            >
              {session.start.isPending ? "Opening the room…" : "Start voice interview"}
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

            {!useText ? (
              <VoiceMode
                realtime={voice}
                question={currentPrompt?.text ?? "Preparing your question…"}
                onConnect={() => {
                  if (currentPrompt) void voice.connect(currentPrompt.id);
                }}
              />
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                {useText
                  ? "Text answers are saved in the same transcript."
                  : "Microphone trouble? You can continue by typing."}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (useText) setUseText(false);
                  else void switchToText();
                }}
                disabled={voice.saving || session.answer.isPending}
              >
                {useText ? "Return to voice" : "Use text instead"}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Saved transcript</CardTitle>
                <CardDescription>
                  Your spoken and typed answers feed the same interview debrief.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptList
                  transcript={transcript}
                  pending={session.answer.isPending || voice.saving}
                />
              </CardContent>
              {useText ? (
                <CardFooter>
                  <AnswerComposer
                    value={answer}
                    onChange={setAnswer}
                    onSubmit={submitAnswer}
                    pending={session.answer.isPending}
                  />
                </CardFooter>
              ) : null}
            </Card>
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
