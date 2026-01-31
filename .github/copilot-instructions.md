# auto-conformance-cli: AI agent notes

## Architecture and data flow
- Entry point is [src/index.ts](src/index.ts) which calls `runCli()` in [src/cli.ts](src/cli.ts).
- CLI builds a `Runner` with `ConformanceApi`, then runs `executePlan()` for each module (see [src/core/runner.ts](src/core/runner.ts)).
- `Runner` orchestrates the conformance lifecycle: register module → poll for `CONFIGURED` → start → poll until `FINISHED`/`INTERRUPTED`.
- When a module is `WAITING`, `Runner` triggers configured actions once (tracked via `executedActions`).
- Actions come from config JSON and are executed by `ActionExecutor` (see [src/core/actions.ts](src/core/actions.ts)).
- Variable capture is central: `captureFromObject()` crawls API responses/logs and URLs to extract `capture_vars` into a shared map (see [src/core/capture.ts](src/core/capture.ts)).
- Templating uses `{{var}}` placeholders across strings, objects, arrays (see [src/core/template.ts](src/core/template.ts)).
- `ConformanceApi` is the only place that talks to the OpenID conformance server APIs (see [src/core/conformanceApi.ts](src/core/conformanceApi.ts)).
- Playwright is only used to follow `callback_to` URLs and capture redirected params (see [src/core/playwrightRunner.ts](src/core/playwrightRunner.ts)).

## Key config patterns
- Config schema is validated with Zod in [src/config/schema.ts](src/config/schema.ts); add new config fields here first.
- `capture_vars` is optional but used across polling + action execution to keep a single mutable capture map.
- Action payload/headers are templated before request; `method` defaults to `POST`.

## Developer workflows
- Build: `npm run build` (tsc output to dist/).
- Dev run: `npm run dev -- --config ./config.json --plan-id <PLAN_ID> --token <TOKEN>`.
- Runtime entry: `node dist/index.js` or `npm start`.
- Tests: `npm test` (Jest with ts-jest; test files `**/*.spec.ts` or `**/*.test.ts`).
- Playwright browsers must be installed once: `npx playwright install --with-deps`.

## Project-specific conventions
- Logging is intentionally plain and in English (see [src/core/logger.ts](src/core/logger.ts)); keep style consistent.
- Errors are surfaced as thrown `Error` instances; `cli.ts` is the central error-to-exit boundary.
- HTTP calls use the shared `HttpClient` wrapper (see [src/core/httpClient.ts](src/core/httpClient.ts)) to enforce auth headers and timeouts.

## Integration points
- External API endpoints: `api/runner`, `api/info/{id}`, `api/log/{id}` on the configured conformance server.
- Auth is always Bearer token from CLI flag or `CONFORMANCE_TOKEN`.
- Polling intervals and timeouts are CLI-configurable; default values are in [src/cli.ts](src/cli.ts).