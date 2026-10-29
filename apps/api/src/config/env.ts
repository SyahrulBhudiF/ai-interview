import { Config, ConfigProvider, Effect, Option } from "effect";

export type LogLevel = "debug" | "info" | "warning" | "error" | "fatal";

const config = Config.all({
  port: Config.Number("API_PORT").pipe(Config.withDefault(3001)),
  idleTimeoutSeconds: Config.Number("API_IDLE_TIMEOUT_SECONDS").pipe(Config.withDefault(120)),
  maxRequestBodyBytes: Config.Number("API_MAX_REQUEST_BODY_BYTES").pipe(
    // Enough for the 10MB CV upload plus multipart overhead.
    Config.withDefault(12 * 1024 * 1024),
  ),
  databaseUrl: Config.String("DATABASE_URL").pipe(
    Config.withDefault("postgresql://ai_interview:ai_interview@127.0.0.1:5432/ai_interview"),
  ),
  nodeEnv: Config.Literals(["development", "test", "production"], "NODE_ENV").pipe(
    Config.withDefault("development"),
  ),
  logLevel: Config.Literals(["debug", "info", "warning", "error", "fatal"], "LOG_LEVEL").pipe(
    Config.withDefault("info"),
  ),
  geminiApiKey: Config.option(Config.String("GEMINI_API_KEY")),
  dataEncryptionKey: Config.option(Config.String("DATA_ENCRYPTION_KEY")),
  geminiTimeoutMs: Config.Number("GEMINI_TIMEOUT_MS").pipe(Config.withDefault(90_000)),
  geminiModelsTimeoutMs: Config.Number("GEMINI_MODELS_TIMEOUT_MS").pipe(Config.withDefault(15_000)),
});

export const env = Effect.runSync(
  Effect.provide(config, ConfigProvider.fromEnv().pipe(ConfigProvider.layer)),
);

if (env.nodeEnv === "production") {
  const key = Option.isSome(env.dataEncryptionKey) ? env.dataEncryptionKey.value.trim() : "";

  if (!key) {
    throw new Error("DATA_ENCRYPTION_KEY is required when NODE_ENV=production");
  }

  if (Buffer.from(key, "base64").length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
}
