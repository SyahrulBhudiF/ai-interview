import { Config, ConfigProvider, Effect } from "effect";

export type LogLevel = "debug" | "info" | "warning" | "error" | "fatal";

const config = Config.all({
  port: Config.Number("API_PORT").pipe(Config.withDefault(3001)),
  databaseUrl: Config.String("DATABASE_URL").pipe(
    Config.withDefault("postgresql://ai_interview:ai_interview@127.0.0.1:5432/ai_interview"),
  ),
  nodeEnv: Config.Literals(["development", "test", "production"], "NODE_ENV").pipe(
    Config.withDefault("development"),
  ),
  logLevel: Config.Literals(["debug", "info", "warning", "error", "fatal"], "LOG_LEVEL").pipe(
    Config.withDefault("info"),
  ),
});

export const env = Effect.runSync(
  Effect.provide(config, ConfigProvider.fromEnv().pipe(ConfigProvider.layer)),
);
