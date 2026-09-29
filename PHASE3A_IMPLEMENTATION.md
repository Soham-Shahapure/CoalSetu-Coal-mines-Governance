# Phase 3A — Manager Foundation + Deterministic Intelligence

This build starts from the locked Phase 2 baseline `Phase 2 complete(1).zip`.

## Added
- Manager-specific TypeScript contracts in `src/types/manager.ts`.
- Protected Manager APIs:
  - `GET /api/manager/overview`
  - `GET /api/manager/mines`
  - `GET /api/manager/mines/:mineId`
- Deterministic Manager aggregation in `server/db.ts`.
- Three-mine Manager scope:
  - Jhanjhra Underground Mine — live Phase 1/2 records.
  - Representative Mine B — synthetic demo management data.
  - Representative Mine C — synthetic demo management data.
- Manager dashboard replacing the Phase 3 placeholder.
- Transparent 0–100 prototype Mine Governance Risk Score using the currently available Phase 3A components:
  - severity-weighted observations: 25%
  - recurring observation rate: 20%
  - observation burden: 15%
- Missing corrective-action components remain `null`; they are not treated as zero.
- Data confidence is displayed separately from risk score.
- Overman `AUTO` entries are not double-counted as new Manager observations; only `OVERMAN_INPUT` entries are treated as additional observations.
- Manager observations never automatically create corrective tasks.

## Phase 3A boundaries
- No AI-generated risk score.
- No corrective-action creation workflow.
- No automatic legal-compliance determination.
- Existing Sirdar and submitted Overman records remain immutable.

## Run locally
```powershell
npm install
npm run dev
```

The existing Phase 2 `dev` script remains in place and opens the app automatically.

## Manager demo login
- Employee ID: `M001`
- Name: R. Mehta

## Note on representative mines
Representative Mine B/C are explicitly synthetic demo data. They do not claim to represent real CIL mine operational records.

## Step 3 — Deterministic Risk Engine

The Phase 3A risk engine is isolated in `server/managerRisk.ts` so the formula can be tested independently from the API/UI.

Weights:
- Severity-weighted observations: 25%
- Recurring observation rate: 20%
- Overdue action rate: 20% (Phase 3B; unavailable in 3A)
- Observation burden: 15%
- Closure performance risk: 10% (Phase 3B; unavailable in 3A)
- Closure time risk: 10% (Phase 3B; unavailable in 3A)

When Phase 3B components are unavailable, they are excluded from both numerator and denominator. They are never treated as zero risk.

Run the deterministic unit test with:
`npm run test:risk`

## Step 4 — Manager Dashboard UI Refinement

Step 4 refines the Manager presentation layer without changing the existing Manager APIs or statutory Sirdar/Overman data structures.

### UI additions/refinements
- Area-level observed-risk snapshot.
- Live vs representative demo data coverage indicator.
- Higher observed-risk signal count based on the prototype 70+ score band.
- Analysis-period display in the Manager header.
- Clearer mine-profile selection and evidence hierarchy.
- Explicit risk-score methodology card showing all six planned weights and Phase 3B-dependent components.
- Recent observations explicitly state that observations are not automatically converted into tasks.
- Observation severity wording is presented as an analytical weight, not a statutory DGMS classification.

### Step 4 scope boundary
- No new Manager API endpoints.
- No corrective-action workflow.
- No AI-generated management brief.
- No changes to Sirdar or Overman submission logic.
