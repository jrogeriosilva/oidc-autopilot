# oidc-autopilot: AI agent notes

## Project Overview

**oidc-autopilot** is a CLI tool that automates OpenID Connect Conformance Suite tests. It orchestrates test execution by registering test modules, polling their status, handling browser navigation via Playwright, and executing custom HTTP actions when tests enter WAITING state. It also provides a web-based GUI dashboard as an alternative interface.

## Development Rules
- Use the playwright MCP if need test the front end.

## Common Commands

```bash
# Setup
npm install
npx playwright install --with-deps

# Build
npm run build

# Run CLI
npm run dev -- --config ./my.config.json --plan-id <PLAN_ID> --token <TOKEN>
npm start -- --config ./my.config.json --plan-id <PLAN_ID>

# Run GUI dashboard (builds React SPA + Express server on port 3000)
npm run gui                        # production: build + serve
npm run gui -- --port=8080         # custom port
npm run dev:gui                    # dev: Vite (5173) + Express (3001) with hot reload

# Build frontend only
npm run build:web                  # builds to dist/client/
npm run build:all                  # backend + frontend

# Tests
npm test                           # all tests
npm test -- src/core/runner.spec.ts  # single file
npm test -- --watch                # watch mode
```

## Architecture

### Execution Flow
1. **Entry**: `src/index.ts` → `runCli()` in `src/cli.ts`
2. **Config Loading**: `loadConfig()` validates `.config.json` files using Zod schemas from `src/config/schema.ts`
3. **Sequential Module Execution**: `Runner` (src/core/runner.ts) executes test modules one at a time
4. **State Management**: `StateManager` (src/core/stateManager.ts) handles polling and state transitions

**IMPORTANT CONSTRAINT**: Modules MUST execute sequentially. The OpenID Conformance Suite does NOT support parallel test execution. Each test module must complete before the next one starts.

### Test State Machine
```
CREATED → CONFIGURED → RUNNING → WAITING → FINISHED/INTERRUPTED
                                     ↓
                    Browser Navigation (once) + Actions (once)
```

When a test enters WAITING state:
1. **Navigation** (once): Uses `runnerInfo.browser.urls[0]` or first GET from `urlsWithMethod`, navigates via Playwright
2. **Actions** (once): Executes configured actions (API or browser types) sequentially after navigation completes

### Key Components

| Component | File | Role |
|-----------|------|------|
| Runner | `src/core/runner.ts` | Main orchestrator, sequential module execution |
| StateManager | `src/core/stateManager.ts` | Polls module status, triggers navigation/actions on WAITING |
| ConformanceApi | `src/core/conformanceApi.ts` | All conformance API calls (register, start, poll, logs) |
| ActionExecutor | `src/core/actions.ts` | Handles API (HTTP) and Browser (Playwright) actions via discriminated union |
| HttpClient | `src/core/httpClient.ts` | HTTP requests with automatic variable capture |
| BrowserSession | `src/core/browserSession.ts` | Playwright browser lifecycle, shared per module |
| Capture | `src/core/capture.ts` | `captureFromObject()` / `captureFromUrl()` extract variables |
| Template | `src/core/template.ts` | `applyTemplate()` replaces `{{var}}` placeholders |
| Logger | `src/core/logger.ts` | Structured logging with correlation IDs, DEBUG mode |
| Errors | `src/core/errors.ts` | `ModuleExecutionError`, `ActionExecutionError`, `StateTimeoutError`, `BrowserNavigationError` |
| Types | `src/core/types.ts` | `TestState`, `TestResult`, `ModuleResult`, `ExecutionSummary`, `RunnerOptions` |

**Note**: The legacy `pollRunnerStatus()` in `src/core/runnerHelpers.ts` is deprecated. Use `StateManager` for all new code.

### GUI Dashboard (`npm run gui`)
- **Backend**: `src/guiEntry.ts` → `OidcAutopilotDashboard` in `src/gui/server.ts`
- Express server with SSE for real-time log streaming and module status updates
- Serves the React SPA from `dist/client/` (built by Vite)
- API Routes: `GET /api/health`, `GET /api/feed` (SSE), `POST /api/launch`, `POST /api/stop`, `GET /api/configs`, `GET /api/env-defaults`, `GET/PUT/DELETE /api/config/:filename`, `GET /api/plan/info/:planName`
- Stop handler cancels runners via `DELETE /api/runner/{id}`

### React Frontend (`web/`)
- **Stack**: React 19, TypeScript, Vite, TailwindCSS v4, lucide-react, react-router-dom
- **Entry**: `web/index.html` → `web/src/main.tsx` → `<App />` with BrowserRouter
- **Pages**: `DashboardPage` (/) and `ConfigManagerPage` (/config-manager)
- **State**: `useReducer` + custom hooks (`useDashboard`, `useConfigManager`, `useSSE`, `useDragReorder`)
- **API client**: `web/src/api/client.ts` (dashboard) and `web/src/api/configApi.ts` (config manager)
- **Types**: `web/src/types/api.ts` mirrors backend types (not imported cross-project)
- **Dev workflow**: `npm run dev:gui` starts Vite dev server (port 5173) proxying `/api/*` to Express (port 3001)

### Variable Capture & Templating
- **Variable Precedence**: captured > module variables > global variables
- **Capture Sources**: JSON response bodies, URL query parameters, nested structures
- **Templating**: `{{var}}` placeholders in action endpoints, payloads, headers, and URLs
- **HTTP Integration**: `HttpClient.requestJson()` automatically captures from request URLs, response bodies, and text responses

### Typed Actions System
- **API Actions**: `type: "api"` — HTTP requests via `HttpClient` with automatic variable capture. Fields: `endpoint`, `method`, `payload`, `headers`
- **Browser Actions**: `type: "browser"` — Playwright operations. Fields: `operation` (currently `navigate`), `url`, `wait_for` (`networkidle`/`domcontentloaded`/`load`)
- Browser session is shared across all actions within a module (preserves cookies/state)

## Important Conventions

### Configuration Files
- **Must** end with `.config.json` suffix (enforced in loadConfig.ts)
- Schema validation via `planConfigSchema` in `src/config/schema.ts`
- Add new config fields to the Zod schema first — TypeScript types are auto-inferred

### Error Handling
- `cli.ts` is the error-to-exit boundary; all other modules throw custom errors from `src/core/errors.ts`
- All errors preserve cause chains for full traceability

### Logging
- Use `createLogger()` from `src/core/logger.ts`
- Regular logs: `[module-name] message` or `[module-name:action-name] message`
- Debug logs (`DEBUG=true`): `[timestamp:module:state:action] message` with full correlation context

### Testing
- Jest with ts-jest preset, config in `jest.config.ts`
- Test files: `**/*.spec.ts` colocated with source in `src/`
- Use `isolateModule()` from `src/testUtils/isolateModule.ts` for module isolation

### Environment Variables
Set in `.env` (see `env.example`):
- `CONFORMANCE_TOKEN` — Bearer token for API auth (required)
- `CONFORMANCE_SERVER` — Base URL (optional, defaults to `https://www.certification.openid.net`)
- `CONFORMANCE_PLAN_ID` — Default plan ID (optional, overridden by `--plan-id`)

## Modifying the Codebase

### Adding New Configuration Fields
1. Update Zod schema in `src/config/schema.ts`
2. Types are auto-inferred — handle the new field in runner or action executor

### Adding Conformance API Endpoints
1. Add method to `ConformanceApi` class in `src/core/conformanceApi.ts`
2. Use `HttpClient` with `CaptureContext` to maintain variable capture

### Extending Action Execution
1. Update action schemas in `src/config/schema.ts` (discriminated union)
2. Modify `ActionExecutor` in `src/core/actions.ts` to handle new action types
3. Ensure template interpolation via `applyTemplate()`

### Browser Automation
- `BrowserSession` (src/core/browserSession.ts) manages Playwright lifecycle per module
- Headless by default (override with `--no-headless`)
- Wait strategies: `networkidle`, `domcontentloaded`, `load`
- Always capture final URL and query params after navigation
