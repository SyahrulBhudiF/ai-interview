---
name: verifying-ai-interview
description: Runs the monorepo's typecheck, tests, lint, format, and build checks in one batch, and inspects the rendered UI with a browser screenshot for visual changes. Use before declaring any change complete.
---

# Verifying ai-interview

One batch command for the static checks, plus a real render check for anything a
user sees.

## Static checks

Run `scripts/checks.sh` from the repo root. It runs, in order, and stops at the
first failure:

- `bun run check-types`
- `bun run test`
- `bun run lint`
- `bun run fmt:check`
- `bun run build`

Report the result honestly — never claim a check passed if it failed, and never
edit code or tests just to make a check green.

## Visual changes

For any change that affects a UI's appearance, inspect the real rendered result:

1. Start the API and web dev servers (Bun):

   ```sh
   cd apps/api && bun src/index.ts &    # http://localhost:3001
   cd apps/web && bun run dev &         # http://localhost:3000
   ```

2. Open the page and capture a screenshot with `agent-browser`:

   ```sh
   agent-browser open http://localhost:3000/
   agent-browser screenshot
   ```

3. Read the capture with `view_media`, passing an objective that names the expected
   result. A screenshot you did not inspect verifies nothing. Re-capture until the
   render is correct.
4. Drive the interaction (fill the form, click submit) and confirm the result in
   the DOM or a second capture.
5. Stop the servers when done; leave nothing listening on 3000/3001.

Embed the inspected screenshot(s) in the final answer. For non-visual changes,
the static checks are sufficient.
