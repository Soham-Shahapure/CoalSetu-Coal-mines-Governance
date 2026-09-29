# Manager Dashboard — Risk Score & Data Coverage Clarity

## UI changes
- Explain that each 0–100 risk contributor is a normalized indicator score, not an accident probability.
- Show a short definition for every contributor and the component's weighted contribution to the current overall score.
- Clarify that unavailable corrective-action/closure components are excluded from the current weighted average, not treated as zero.
- Explain that prototype scoring thresholds are management heuristics, not DGMS-prescribed scoring rules.
- Rename the observations metric to **Normalized observations**.
- Rename the data card to **Data coverage & confidence** and explain what report and observation counts mean.
- Describe examples of normalized observation signals generated from submitted Sirdar/Overman data and note that auto-mapped copies are not double-counted.
- Display the observed date range and the prototype LOW/MEDIUM/HIGH coverage thresholds.
- Explicitly distinguish this count-based coverage indicator from AI confidence; Phase 3C may use it as context for AI summaries.
- Clearly label representative demo data so its coverage level is not mistaken for live operational evidence.

## Existing calculation behavior retained
No backend formula, stored data, task workflow, or role permissions were changed in this update.
