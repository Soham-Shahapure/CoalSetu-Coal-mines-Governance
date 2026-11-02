

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to your Gemini API key. Keep `.env` private; never commit or share it.
3. Optionally set `GEMINI_MODEL_ID` (default: `gemini-3.5-flash-lite`). No paid-model fallback is configured.
4. Run the app:
   `npm run dev`

## Phase 3C — AI Governance Insights

- Open the Manager dashboard and use **AI Insights** in the section navigation.
- Choose area-wide or selected-mine scope and a 7, 14, 30, or 90-day period, then select **Generate AI Insights**.
- Reports are generated on demand, saved with an evidence snapshot, and available in history. Archived reports can be restored; saved report content cannot be edited or permanently deleted through the Manager UI.
- AI findings are advisory. The deterministic governance score and submitted source records are not changed.
- If `GEMINI_API_KEY` is missing/invalid, the configured model is unavailable, or free-tier quota is exhausted, generation reports an error and does not save an AI report.
- Use synthetic/demo data until the provider's data-use terms and authorization for any real operational data have been reviewed.
- History is stored in `data/ai_insights_store.json`, separate from the statutory mine data file. Back up this file along with the project data if you need to retain generated reports.

## Corrective action execution and verification
Phase 3B-2 adds the Overman start/work/evidence submission flow and Manager verification/return flow. See `PHASE3B_2_IMPLEMENTATION.md` for status transitions, API routes, evidence limits, and validation notes.
