import type { TranscriptEntry, TranscriptRole } from "@ai-interview/shared";
import { asc, desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { transcriptEntries } from "@/database/schema";

import { newTranscriptEntryRow, toTranscriptEntry } from "../mapper";

export interface ITranscriptService {
  append(
    sessionId: string,
    role: TranscriptRole,
    text: string,
    questionId?: string,
  ): Effect.Effect<TranscriptEntry>;
  list(sessionId: string): Effect.Effect<ReadonlyArray<TranscriptEntry>>;
}

export class TranscriptService extends Context.Service<TranscriptService, ITranscriptService>()(
  "ai-interview/session/TranscriptService",
) {
  static readonly layer = Layer.effect(
    TranscriptService,
    Effect.gen(function* () {
      const { db } = yield* Database;

      const append = Effect.fn("TranscriptService.append")(function* (
        sessionId: string,
        role: TranscriptRole,
        text: string,
        questionId?: string,
      ) {
        const existing = yield* Effect.promise(() =>
          db
            .select({ order: transcriptEntries.order })
            .from(transcriptEntries)
            .where(eq(transcriptEntries.sessionId, sessionId))
            .orderBy(desc(transcriptEntries.order))
            .limit(1),
        );

        const row = newTranscriptEntryRow(
          sessionId,
          role,
          text,
          (existing[0]?.order ?? -1) + 1,
          questionId,
        );

        const inserted = yield* Effect.promise(() =>
          db.insert(transcriptEntries).values(row).returning(),
        );

        const created = inserted[0];
        if (!created) return yield* Effect.die("Expected insert to return a row");
        return toTranscriptEntry(created);
      });

      const list = Effect.fn("TranscriptService.list")(function* (sessionId: string) {
        const rows = yield* Effect.promise(() =>
          db
            .select()
            .from(transcriptEntries)
            .where(eq(transcriptEntries.sessionId, sessionId))
            .orderBy(asc(transcriptEntries.order)),
        );

        return rows.map(toTranscriptEntry);
      });

      return TranscriptService.of({ append, list });
    }),
  );
}
