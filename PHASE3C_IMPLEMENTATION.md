# Phase 3C — AI Governance Insights

## Delivered behavior

- On-demand Gemini generation for an authorized area or selected mine and a 7/14/30/90-day window.
- Server-side evidence preparation and aggregation; AI never calculates or changes the existing dashboard risk score.
- Four report sections: Area Summary, Recurring Patterns, Areas Requiring Attention, and Supporting Evidence.
- Model output is JSON-parsed and validated against the supplied evidence reference set. Unsupported/malformed output receives at most one automatic retry per request.
- Successful reports are persisted with the analysis window, model/prompt/schema versions, metric snapshot, data coverage, and source evidence snapshot.
- Immutable report content with archive/restore metadata and audit events.
- One active generation per Manager in the running server process; duplicate starts return HTTP 409.
- Generation status is persisted and can be retrieved after page refresh. A server restart marks previously running requests interrupted rather than blindly re-running a potentially completed provider call.
- API key stays server-side. Missing key, invalid key, unavailable model, quota, no-data, and validation errors do not result in a successful saved report.

## API routes

- `POST /api/manager/ai-insights/generate`
- `GET /api/manager/ai-insights/generation-status`
- `GET /api/manager/ai-insights/generations/:requestId`
- `GET /api/manager/ai-insights` (supports `mineId`, `scopeType`, `periodDays`, `archived`, `page`)
- `GET /api/manager/ai-insights/:reportId`
- `GET /api/manager/ai-insights/:reportId/evidence/:evidenceId`
- `POST /api/manager/ai-insights/:reportId/archive`
- `POST /api/manager/ai-insights/:reportId/restore`

## Data and limitations

- AI history lives in `data/ai_insights_store.json`; statutory records remain in the existing JSON store.
- The prototype's existing Manager access model exposes the current active demo mine list to a Manager. It does not yet model granular Manager-to-area assignments. This phase reuses the existing demo access convention; do not deploy with real operational data until authentication and fine-grained area authorization are hardened.
- The configured default model is `gemini-3.5-flash-lite`. Availability and free-tier quota depend on the API project. Set `GEMINI_API_KEY` in local `.env`; never put it in frontend code or a ZIP.
- The server sends at most 150 sanitized evidence items per generation request. The report snapshot retains the evidence package for auditability. Coverage levels are heuristics, not AI confidence or proof of safety.
- JSON file writes use temporary-file rename. This prototype does not provide cross-process distributed locking or tamper-proof audit storage. Run a single server instance; production deployment should use transactional shared storage and stronger authentication/authorization.

## Local verification

1. `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
3. `npm run lint`
4. `npm run test:risk`
5. `npm run build`
6. `npm run dev` and sign in as `M001` to review the Manager UI. Without a valid key/free quota, generation should fail visibly and must not save a report.
