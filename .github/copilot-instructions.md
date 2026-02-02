# auto-conformance-cli: AI agent notes

## Big picture architecture
- Entry point is [src/index.ts](src/index.ts), which calls `runCli()` in [src/cli.ts](src/cli.ts).
- `runCli()` loads env, resolves `--config`, and rejects configs without the .config.json suffix (see [src/config/loadConfig.ts](src/config/loadConfig.ts)).
- `Runner` executes modules sequentially (see [src/core/runner.ts](src/core/runner.ts)) and delegates polling/state handling to [src/core/runnerHelpers.ts](src/core/runnerHelpers.ts).
- State flow: register runner → poll info → when `WAITING`, run browser navigation once, then execute actions once; finish when `FINISHED`/`INTERRUPTED`.
- Navigation uses `runnerInfo.browser.urls[0]` or the first GET entry in `urlsWithMethod`, then Playwright (see [src/core/playwrightRunner.ts](src/core/playwrightRunner.ts)).
- After actions, if `CONSTANTS.CALLBACK_VARIABLE_NAME` is present in captured vars, the runner navigates to it and captures final URL params.

## Data capture + templating
- `captureFromObject()` and `captureFromUrl()` crawl JSON, arrays, and URL strings to update the shared `capture_vars` map (see [src/core/capture.ts](src/core/capture.ts)).
- `HttpClient.requestJson()` captures from request URL, response text (when `allowNonJson`), and parsed JSON (see [src/core/httpClient.ts](src/core/httpClient.ts)).
- `applyTemplate()` replaces `{{var}}` in strings/arrays/objects; actions template endpoint, payload, and headers before request (see [src/core/template.ts](src/core/template.ts) and [src/core/actions.ts](src/core/actions.ts)).

## Integration points
- Conformance API is centralized in [src/core/conformanceApi.ts](src/core/conformanceApi.ts):
  - POST api/runner (register), GET api/info/{id}, GET api/runner/{id}, GET api/log/{id}, POST api/runner/{id} (start).
- Auth is always Bearer token from CLI `--token` or `CONFORMANCE_TOKEN`; base URL defaults to https://www.certification.openid.net.
- Any new conformance endpoint should use `HttpClient` with `CaptureContext` so `capture_vars` stay current.

## Developer workflows
- Setup: `npm install` then `npx playwright install --with-deps`.
- Build: `npm run build` (tsc → dist/). Dev: `npm run dev -- --config ./x.config.json --plan-id <PLAN_ID> --token <TOKEN>`.
- Tests: `npm test` (Jest; tests are in src/**/*.spec.ts).

## Project-specific conventions
- Logging is plain English via `createLogger()` (see [src/core/logger.ts](src/core/logger.ts)).
- `cli.ts` is the error-to-exit boundary; other layers throw `Error`.
- Config schema lives in [src/config/schema.ts](src/config/schema.ts); add/validate new config fields there first.
