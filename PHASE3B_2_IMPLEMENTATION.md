# Phase 3B-2 — Corrective Action Execution and Verification

## Purpose
Extend the tested corrective-action foundation so an assigned Overman can record completed work and supporting evidence, and the Manager can verify the result or return it for further work.

## User workflow
1. Manager creates and assigns an action (existing Phase 3B-1 workflow).
2. Assigned Overman selects **Start Action**. Status changes from `OPEN` to `IN_PROGRESS`.
3. Overman records a work summary and at least one evidence item: an evidence note and/or a PNG, JPEG, WEBP image, or PDF attachment.
4. Overman submits the action for review. Status changes to `SUBMITTED_FOR_VERIFICATION`.
5. Manager reviews the work summary, evidence, and action history. The Manager either:
   - verifies the action, changing status to `VERIFIED`; or
   - returns it with a mandatory reason, changing status back to `IN_PROGRESS`.
6. The Overman can address the return reason and submit updated work/evidence again.

## Status transitions
- `OPEN` → `IN_PROGRESS`: assigned Overman starts the action.
- `IN_PROGRESS` → `SUBMITTED_FOR_VERIFICATION`: Overman submits a work summary and evidence.
- `SUBMITTED_FOR_VERIFICATION` → `VERIFIED`: Manager verifies the submission.
- `SUBMITTED_FOR_VERIFICATION` → `IN_PROGRESS`: Manager returns it with a reason.

The API validates each transition server-side. Only the assigned Overman can start or submit their task. Only a Manager can verify or return submitted actions.

## Evidence
- Evidence notes and optional attachments are stored in the existing JSON task record.
- Allowed attachment types: PNG, JPEG, WEBP, PDF.
- Maximum attachment size: 3 MB per file.
- A work summary and at least one evidence item are required before submission.
- Evidence records include type, name, description, timestamp, and submitting user ID.
- Evidence and audit events are retained when an action is returned, preserving the record of earlier submissions.

## Audit history
The task audit history records creation, assignment, start, submission for verification, Manager verification, and return events with actor and timestamp. The Manager review dialog and Overman action card expose this history.

## API routes added
- `POST /api/overman/tasks/:id/start`
- `POST /api/overman/tasks/:id/submit`
- `POST /api/manager/tasks/:id/verify`
- `POST /api/manager/tasks/:id/return`

## Existing records and scope
- Sirdar inspections and submitted Overman statutory reports remain unchanged and immutable.
- Corrective actions are separate records; evidence does not edit source statutory records.
- No AI decides whether an action is complete. The Manager remains responsible for verification.
- The task data model is still stored in `data/mine_governance_store.json`, consistent with the current prototype architecture.

## Validation
- TypeScript/JSX syntax transpilation passed for the modified server, database, API, type, and component files.
- Full `npm run lint` / production build could not be run in the packaging environment because dependency installation timed out and the local `vite/client` type package was incomplete. Run `npm install`, `npm run lint`, and `npm run dev` locally to validate the complete environment.
