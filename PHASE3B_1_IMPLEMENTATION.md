# Phase 3B-1 — Management Corrective Action Foundation

This increment adds the foundation for Manager-created corrective actions.

## Scope
- Manager creates a corrective action manually.
- Manager chooses title, description, priority, due date, and Overman assignee.
- Manager may optionally link one or more submitted evidence observations.
- Submitted observations remain immutable; linking does not modify them.
- Actions are stored with an immutable creation/assignment audit trail.
- Overman can view actions assigned to the logged-in Overman.
- No action is generated automatically from an observation.
- No AI decides whether an action is required, what it should say, its priority, or its assignee.

## Status foundation
Tasks are created with `OPEN`. The remaining execution states are defined now for later workflow work:
`OPEN`, `IN_PROGRESS`, `SUBMITTED_FOR_VERIFICATION`, `VERIFIED`, `CANCELLED`.

Status transitions, evidence submission, Manager verification, and risk-score integration are intentionally reserved for the next Phase 3B increments.

## API
Manager:
- `GET /api/manager/task-assignees?mineId=...`
- `GET /api/manager/tasks`
- `GET /api/manager/tasks/:id`
- `POST /api/manager/tasks`

Overman:
- `GET /api/overman/tasks`
- `GET /api/overman/tasks/:id`

## Testing
Run locally:

```powershell
npm install
npm run lint
npm run dev
```

Then:
1. Login as `M001`.
2. Select Jhanjhra Underground Mine.
3. Open **Corrective Actions**.
4. Create a task manually and assign it to Arjun Singh / O001.
5. Confirm the task appears with `OPEN` status.
6. Logout and login as `O001`.
7. Open **Corrective Actions** and confirm the assigned task appears.
8. Confirm no task is created merely by viewing an observation.
