{
  pkgs,
  lib,
  config,
  ...
}:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    bun.enable = true;
  };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    listen_addresses = "127.0.0.1";
    port = 5432;
    initialScript = ''
      CREATE ROLE ai_interview WITH LOGIN PASSWORD 'ai_interview' SUPERUSER;
    '';
    initialDatabases = [
      { name = "ai_interview"; }
    ];
  };

  env = {
    DATABASE_URL = "postgresql://ai_interview:ai_interview@127.0.0.1:${toString config.env.PGPORT}/ai_interview";
    API_PORT = "3001";
  };

  enterShell = ''
    echo "ai-interview dev environment ready"
    echo "  bun run dev --filter api   -> http://localhost:3001"
    echo "  bun run dev --filter web   -> http://localhost:3000"
  '';
}
