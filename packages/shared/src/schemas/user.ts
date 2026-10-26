import { Schema } from "effect";

/** Wire shape for a user. Timestamps are ISO strings, never `Date`. */
export const UserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
});

export type User = Schema.Schema.Type<typeof UserSchema>;
