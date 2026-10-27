# AI Voice Interview Platform — Implementation Plan

Target state: a mock-interview app where a user configures an interview, Gemini
generates a structured plan, a real-time voice conversation runs against Gemini
Live, and the backend produces a structured evaluation report.

This plan maps the feature spec onto the existing monorepo conventions (Elysia 2 +
Effect v4 API modules, TanStack Start web features, shared Effect Schemas,
Drizzle). Each phase ends in a runnable, verifiable state.

## Tech choice

- **TanStack AI** for Gemini: `@tanstack/ai`, `@tanstack/ai-gemini`, `@tanstack/ai-react`.
- Gemini API key stays server-side only (Effect `Config`, never shipped to the client).
- Structured outputs use `outputSchema` (Standard Schema) — our `packages/shared`
  Effect Schemas plug straight in, so the same types drive Elysia validation,
  Eden, frontend decoding, AND the Gemini contract.

## Architecture mapping

Spec principle: **backend is the source of truth; Gemini is conversational
intelligence only.** Every spec service becomes an Effect service in
`apps/api/src/modules/<name>/` (controller + service + error + mapper).

| Spec service                 | Module (Effect service)        | Responsibility                              |
| ---------------------------- | ------------------------------ | ------------------------------------------- |
| InterviewService             | `modules/interview`            | interview config CRUD                       |
| InterviewPlanService         | `modules/interview/plan`       | stage/question plan build + regenerate      |
| InterviewSessionService      | `modules/session`              | session state machine + progression         |
| InterviewOrchestratorService | `modules/session/orchestrator` | ties Gemini + state, enforces rules         |
| GeminiLiveService            | `modules/gemini`               | Gemini adapter (text, structured, realtime) |
| TranscriptService            | `modules/session/transcript`   | transcript persistence                      |
| EvaluationService            | `modules/evaluation`           | rubric evaluation + reports                 |

## Data model

Drizzle tables (`apps/api/src/database/schema.ts`) and shared Effect Schemas
(`packages/shared/src/schemas/`):

- `interviews` — id, title, job_position, experience_level, job_description,
  context, language, difficulty, status (draft/ready), timestamps.
- `interview_stages` — id, interview_id, name, objective, order, main_question_count,
  max_follow_ups, competencies.
- `questions` — id, stage_id, text, order, kind (main/follow-up), answer_criteria, rubric.
- `sessions` — id, interview_id, status, current_stage_id, current_question_id,
  started_at, ended_at.
- `transcript_entries` — id, session_id, role (ai/candidate), text, question_id, timestamp.
- `evaluations` — id, session_id, overall_score, summary, strengths, improvements, timestamps.
- `evaluation_scores` — id, evaluation_id, category, stage_id?, question_id?, score, feedback.

Shared schemas: `interview.ts`, `session.ts`, `evaluation.ts`, and `ai.ts`
(the Gemini structured-output contracts: plan, follow-up decision, evaluation).

## Phases

### Phase 0 — Foundation

- Add `@tanstack/ai`, `@tanstack/ai-gemini`, `@tanstack/ai-react`.
- `GEMINI_API_KEY` via Effect `Config` in `config/env.ts` (+ `.env.example`).
- Drizzle schema + first migration (`bun run --filter api db:generate`).
- Shared Effect Schemas for all entities.
- Deliverable: types + migrations pass `checks.sh`.

### Phase 1 — Builder + Dashboard (no AI)

- `modules/interview` CRUD (list, create, update, duplicate, delete).
- Stage/question manual add/edit/reorder (total question count derived).
- Web: `features/interviews/` (dashboard list) + `features/interview-builder/`
  (multi-stage builder form).
- Deliverable: full CRUD through the UI, backed by Postgres.

### Phase 2 — AI Plan Generator

- `GeminiService` (text + structured output via `chat({ outputSchema })`).
- `POST /api/interviews/:id/generate-plan` → stages, objectives, questions,
  criteria, rubric (Effect Schema `outputSchema`).
- Per-stage regenerate; preview/edit before saving.
- Deliverable: generate + review + save a plan; generated JSON is schema-validated.

### Phase 3 — Session + Transcript (text-first)

- `InterviewSessionService`: state machine (created → ready → in-progress →
  paused/completed/interrupted/cancelled), stage/question progression,
  follow-up count enforcement.
- `TranscriptService`: persist turns, per-question association.
- Text-based interview runner first (no voice) to validate the orchestrator.
- Deliverable: a text interview runs end-to-end with correct progression rules.

### Phase 4 — Real-time voice (Gemini Live)

- `GeminiLiveService`: TanStack AI realtime/Gemini Live adapter.
- WebSocket bridge: web ↔ backend ↔ Gemini Live; backend owns state and validates
  every transition; support interruption, mute, turn-taking.
- Web live UI: avatar/waveform, mic controls, stage/question progress, timer,
  live transcript, end button.
- Deliverable: natural voice-to-voice interview with dynamic follow-ups and
  graceful reconnect (exact realtime adapter API verified in this phase).

### Phase 5 — Evaluation + Results

- `EvaluationService`: `chat({ outputSchema: EvaluationSchema })` over the
  transcript → overall + per-stage + per-competency + per-question scores,
  strengths, improvements, suggested answers, learning recommendations.
- Web `features/interview-results/`: scores, breakdown, transcript, retry.
- Deliverable: completed interview produces a rubric-based report referencing
  actual responses.

### Phase 6 — History, progress, templates, personas (advanced)

- `features/history/`: score comparison, competency trends, retry.
- Interview templates; AI interviewer personas (system prompts); practice weak
  questions; resume/JD analysis (later, optional).

### Phase 7 — Progress dashboard

- `GET /api/progress`: summary counts, average score, score history, and
  competency averages aggregated from evaluated sessions.
- `features/progress/`: summary cards, score history with results/retry links,
  and competency averages sorted weakest first.
- Deliverable: a cross-interview progress view backed by real evaluations.

### Phase 8 — Practice weak questions

- `POST /api/practice`: creates a ready practice interview whose generated plan
  weights questions toward the requested weak competency.
- `features/progress/`: each competency average has a Practice action that opens
  the generated interview.
- Deliverable: a progress → targeted practice loop.

### Phase 9 — Interview management

- `PUT /api/interviews/:id` replaces the editable configuration;
  `DELETE /api/interviews/:id` removes the interview and cascades its plan,
  sessions, and evaluations.
- `features/interview-builder/`: an Interview settings form and a confirmed
  delete action.
- Deliverable: complete interview CRUD from the UI.

### Phase 10 — App shell and dashboard redesign

- Add a persistent header with Interviews/Progress navigation and a New
  interview action.
- Replace the scaffold home with an overview: stats, recent interviews, and how
  it works.
- Move interview creation to `/interviews/new`; the dashboard becomes a
  scannable card grid.
- Rework the builder into a two-column layout with collapsible settings.
- Refresh the theme: Instrument Sans/Serif, warm neutrals, one deep-rose accent.

## Key decisions & risks

- **Follow-ups are dynamic, main questions are fixed.** The orchestrator passes
  the current main question to Gemini and lets it decide follow-ups via a
  structured "next action" tool call, while the backend enforces limits and
  stage transitions.
- **Backend is authoritative.** Gemini never advances the session; it only
  proposes. The orchestrator validates and persists each transition.
- **Effect Schemas = Standard Schema** for every Gemini `outputSchema`, so AI
  output is validated at the boundary (same rule as the rest of the API).
- **Voice is the risky phase.** Gemini Live + WebSocket + interruption/reconnect
  is the least deterministic part; keep it isolated behind `GeminiLiveService`
  so the rest of the system stays testable with text.

## Verification

Every phase ends with `scripts/checks.sh` green; UI phases add a rendered
screenshot inspection via the `verifying-ai-interview` skill; AI phases add a
schema-validated fixture response so tests never require a live Gemini call.
