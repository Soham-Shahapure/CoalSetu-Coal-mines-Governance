import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { aiInsights } from './server/aiInsights.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Request logging for statutory audit trail
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API AUDIT] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Authentication middleware (token / user extraction)
const getAuthUser = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  // For demo/session, token is the user ID or employee ID
  let user = db.getUserById(token);
  if (!user) {
    user = db.authenticate(token);
  }
  return user;
};

const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' });
    return;
  }
  (req as any).user = user;
  next();
};

const requireManager = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  if (!user || user.role !== 'MANAGER') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Manager role is required.' });
    return;
  }
  next();
};

// ================= API ROUTES =================

// 1. Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { employee_id, password } = req.body;
  if (!employee_id) {
    res.status(400).json({ error: 'MISSING_CREDENTIALS', message: 'Employee ID is required.' });
    return;
  }

  // Pre-configured demo logins (S001, O001, M001). Historical S002 records are retained but S002 is inactive.
  const user = db.authenticate(employee_id);
  if (!user) {
    res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid Employee ID. Try demo ID: S001 (Rajesh Kumar), O001 (Arjun Singh), or M001 (R. Mehta).',
    });
    return;
  }

  // Generate session token (using user.id)
  res.json({
    token: user.id,
    user: {
      id: user.id,
      name: user.name,
      employee_id: user.employee_id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    },
  });
});

// 2. Current User Profile
app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

// ================= PHASE 3C: AI INSIGHTS =================
app.post('/api/manager/ai-insights/generate', requireAuth, requireManager, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const generation = aiInsights.start(user.id, req.body || {});
    res.status(202).json({ generation });
  } catch (err: any) {
    const message = String(err?.message || 'Unable to start AI insight generation.');
    const status = message === 'GENERATION_ALREADY_ACTIVE' ? 409 : message === 'FORBIDDEN' || message === 'MINE_NOT_AUTHORIZED' ? 403 : message === 'AI_INSIGHTS_STORE_UNREADABLE' ? 500 : 400;
    res.status(status).json({ error: message, message: message === 'GENERATION_ALREADY_ACTIVE' ? 'An insight generation is already active for this Manager.' : message === 'MINE_NOT_AUTHORIZED' || message === 'FORBIDDEN' ? 'The selected scope is not available to this Manager.' : message === 'AI_INSIGHTS_STORE_UNREADABLE' ? 'AI report history storage could not be read or written safely.' : 'Check the selected scope and analysis period.' });
  }
});
app.get('/api/manager/ai-insights/generation-status', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ generation: aiInsights.active(user.id) });
});
app.get('/api/manager/ai-insights/generations/:requestId', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  const generation = aiInsights.request(user.id, req.params.requestId);
  if (!generation) { res.status(404).json({ message: 'Generation request not found.' }); return; }
  res.json({ generation });
});
app.get('/api/manager/ai-insights', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json(aiInsights.list(user.id, {
    mineId: typeof req.query.mineId === 'string' ? req.query.mineId : undefined,
    scopeType: typeof req.query.scopeType === 'string' ? req.query.scopeType : undefined,
    periodDays: typeof req.query.periodDays === 'string' ? req.query.periodDays : undefined,
    archived: typeof req.query.archived === 'string' ? req.query.archived : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
  }));
});
app.get('/api/manager/ai-insights/:reportId/evidence/:evidenceId', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  const evidence = aiInsights.evidence(user.id, req.params.reportId, req.params.evidenceId);
  if (!evidence) { res.status(404).json({ message: 'Supporting evidence was not found or is no longer accessible.' }); return; }
  res.json({ evidence });
});
app.get('/api/manager/ai-insights/:reportId', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  const report = aiInsights.get(user.id, req.params.reportId);
  if (!report) { res.status(404).json({ message: 'Insight report not found or access is not permitted.' }); return; }
  // Recheck current mine access before returning the saved report.
  try {
    const allowed = new Set(db.getManagerMineProfiles(user.id).map(m => m.mine_id));
    if (report.mineIds.some(id => !allowed.has(id))) { res.status(403).json({ message: 'Current permissions do not allow access to this report.' }); return; }
  } catch { res.status(403).json({ message: 'Current permissions do not allow access to this report.' }); return; }
  res.json({ report });
});
app.post('/api/manager/ai-insights/:reportId/archive', requireAuth, requireManager, (req: Request, res: Response) => {
  try { const user = (req as any).user; res.json({ report: aiInsights.archive(user.id, req.params.reportId, false) }); }
  catch (err: any) { const missing = err?.message === 'REPORT_NOT_FOUND'; res.status(missing ? 404 : 500).json({ message: missing ? 'Insight report not found or access is not permitted.' : 'Report history could not be saved. Please try again.' }); }
});
app.post('/api/manager/ai-insights/:reportId/restore', requireAuth, requireManager, (req: Request, res: Response) => {
  try { const user = (req as any).user; res.json({ report: aiInsights.archive(user.id, req.params.reportId, true) }); }
  catch (err: any) { const missing = err?.message === 'REPORT_NOT_FOUND'; res.status(missing ? 404 : 500).json({ message: missing ? 'Insight report not found or access is not permitted.' : 'Report history could not be saved. Please try again.' }); }
});

// ================= PHASE 3A: MANAGER ANALYTICS =================
app.get('/api/manager/overview', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    res.json(db.getManagerOverview(user.id));
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 500).json({ error: isAuth ? 'FORBIDDEN' : 'MANAGER_ANALYTICS_FAILED', message: err.message || 'Failed to load Manager overview.' });
  }
});

app.get('/api/manager/mines', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    res.json({ mines: db.getManagerMineProfiles(user.id) });
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 500).json({ error: isAuth ? 'FORBIDDEN' : 'MANAGER_ANALYTICS_FAILED', message: err.message || 'Failed to load mine profiles.' });
  }
});

app.get('/api/manager/task-assignees', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const mineId = String(req.query.mineId || '');
    if (!mineId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'mineId is required.' });
      return;
    }
    res.json({ assignees: db.getManagerTaskAssignees(user.id, mineId) });
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 400).json({ error: isAuth ? 'FORBIDDEN' : 'BAD_REQUEST', message: err.message || 'Failed to load task assignees.' });
  }
});

app.get('/api/manager/tasks', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const mineId = req.query.mineId ? String(req.query.mineId) : undefined;
    res.json({ tasks: db.getManagerTasks(user.id, mineId) });
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 500).json({ error: isAuth ? 'FORBIDDEN' : 'TASKS_FAILED', message: err.message || 'Failed to load corrective actions.' });
  }
});

app.get('/api/manager/tasks/:id', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const task = db.getManagerTaskById(user.id, req.params.id);
    if (!task) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Corrective action not found.' });
      return;
    }
    res.json(task);
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 500).json({ error: isAuth ? 'FORBIDDEN' : 'TASKS_FAILED', message: err.message || 'Failed to load corrective action.' });
  }
});

app.post('/api/manager/tasks', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const task = db.createManagerTask(user.id, req.body);
    res.status(201).json(task);
  } catch (err: any) {
    const message = err.message || 'Failed to create corrective action.';
    const isAuth = message.includes('AUTH_ERROR');
    const isValidation = message.includes('VALIDATION_ERROR');
    res.status(isAuth ? 403 : isValidation ? 400 : 500).json({ error: isAuth ? 'FORBIDDEN' : isValidation ? 'BAD_REQUEST' : 'TASK_CREATE_FAILED', message });
  }
});

app.get('/api/overman/tasks', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can access corrective actions.' });
    return;
  }
  try {
    res.json({ tasks: db.getOvermanTasks(user.id) });
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 500).json({ error: isAuth ? 'FORBIDDEN' : 'TASKS_FAILED', message: err.message || 'Failed to load corrective actions.' });
  }
});

app.get('/api/overman/tasks/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can access corrective actions.' });
    return;
  }
  try {
    const task = db.getOvermanTaskById(user.id, req.params.id);
    if (!task) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Corrective action not found.' });
      return;
    }
    res.json(task);
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 500).json({ error: isAuth ? 'FORBIDDEN' : 'TASKS_FAILED', message: err.message || 'Failed to load corrective action.' });
  }
});

app.post('/api/overman/tasks/:id/start', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Only the assigned Overman can start this action.' });
    return;
  }
  try {
    res.json(db.startOvermanTask(user.id, req.params.id));
  } catch (err: any) {
    const message = err.message || 'Failed to start corrective action.';
    const status = message.includes('AUTH_ERROR') ? 403 : message.includes('NOT_FOUND_ERROR') ? 404 : 400;
    res.status(status).json({ error: status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message });
  }
});

app.post('/api/overman/tasks/:id/submit', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Only the assigned Overman can submit this action.' });
    return;
  }
  try {
    res.json(db.submitOvermanTask(user.id, req.params.id, req.body));
  } catch (err: any) {
    const message = err.message || 'Failed to submit corrective action.';
    const status = message.includes('AUTH_ERROR') ? 403 : message.includes('NOT_FOUND_ERROR') ? 404 : 400;
    res.status(status).json({ error: status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message });
  }
});

app.post('/api/manager/tasks/:id/verify', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    res.json(db.verifyManagerTask(user.id, req.params.id, req.body?.note));
  } catch (err: any) {
    const message = err.message || 'Failed to verify corrective action.';
    const status = message.includes('AUTH_ERROR') ? 403 : message.includes('NOT_FOUND_ERROR') ? 404 : 400;
    res.status(status).json({ error: status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message });
  }
});

app.post('/api/manager/tasks/:id/return', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    res.json(db.returnManagerTask(user.id, req.params.id, String(req.body?.reason || '')));
  } catch (err: any) {
    const message = err.message || 'Failed to return corrective action.';
    const status = message.includes('AUTH_ERROR') ? 403 : message.includes('NOT_FOUND_ERROR') ? 404 : 400;
    res.status(status).json({ error: status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message });
  }
});

app.get('/api/manager/mines/:mineId', requireAuth, requireManager, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const detail = db.getManagerMineDetail(user.id, req.params.mineId);
    if (!detail) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Mine profile not found.' });
      return;
    }
    res.json(detail);
  } catch (err: any) {
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isAuth ? 403 : 500).json({ error: isAuth ? 'FORBIDDEN' : 'MANAGER_ANALYTICS_FAILED', message: err.message || 'Failed to load mine detail.' });
  }
});

// 3. Current Sirdar Assignment (Mine, District, Seam, Shifts)
app.get('/api/my-assignment', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'SIRDAR') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Mining Sirdars have district shift assignments.' });
    return;
  }
  const assignment = db.getSirdarAssignment(user.id);
  if (!assignment) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No underground mine assignment found for this Sirdar.' });
    return;
  }
  res.json(assignment);
});

// 4. Shifts list
app.get('/api/shifts', requireAuth, (_req: Request, res: Response) => {
  const shifts = db.getShifts();
  res.json(shifts);
});

// 5. Get Sirdar Inspections (drafts and submitted history)
app.get('/api/my-inspections', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'SIRDAR') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Mining Sirdars have shift inspection histories.' });
    return;
  }
  const inspections = db.getInspectionsSummary(user.id);
  res.json(inspections);
});

// 6. Get single inspection full detail
app.get('/api/inspections/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const inspection = db.getInspectionFull(id);

  if (!inspection) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Inspection record not found.' });
    return;
  }

  // Role authorization:
  if (user.role === 'SIRDAR') {
    // Sirdar may only view their own inspections
    if (inspection.sirdar_id !== user.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You may only view your own inspections.' });
      return;
    }
  } else if (user.role === 'OVERMAN') {
    // Overman may only view submitted Sirdar inspections belonging to their authorized district/mine
    if (inspection.status !== 'SUBMITTED') {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Sirdar draft records are confidential and not accessible to Overman.' });
      return;
    }
    const overmanAssignment = db.getOvermanAssignment(user.id);
    if (!overmanAssignment || inspection.district_id !== overmanAssignment.district.id || inspection.mine_id !== overmanAssignment.mine.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Inspection record is outside your authorized district/panel.' });
      return;
    }
  } else if (user.role === 'MANAGER') {
    // Manager may view submitted records
    if (inspection.status !== 'SUBMITTED') {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Sirdar draft records are not accessible.' });
      return;
    }
  } else {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Unauthorized role.' });
    return;
  }

  res.json(inspection);
});

// 7. Save / Update Draft Inspection
app.post('/api/inspections/draft', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'SIRDAR') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Mining Sirdars can create or edit inspection drafts.' });
    return;
  }
  if (req.body.id) {
    const existing = db.getInspectionFull(req.body.id);
    if (existing && existing.sirdar_id !== user.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only edit your own inspection draft.' });
      return;
    }
  }
  try {
    const saved = db.saveDraft(req.body, user.id);
    res.status(200).json(saved);
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isImmutable || isAuth ? 403 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : 'BAD_REQUEST',
      message: err.message || 'Failed to save draft.',
    });
  }
});

app.put('/api/inspections/draft/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (user.role !== 'SIRDAR') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Mining Sirdars can update inspection drafts.' });
    return;
  }
  const existing = db.getInspectionFull(id);
  if (existing && existing.sirdar_id !== user.id) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only update your own inspection draft.' });
    return;
  }
  try {
    const payload = { ...req.body, id };
    const saved = db.saveDraft(payload, user.id);
    res.status(200).json(saved);
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isImmutable || isAuth ? 403 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : 'BAD_REQUEST',
      message: err.message || 'Failed to update draft.',
    });
  }
});

// 8. Submit Inspection (Atomic, creates permanent immutable statutory record)
app.post('/api/inspections/submit', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'SIRDAR') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Mining Sirdars can submit statutory shift inspections.' });
    return;
  }
  if (req.body.id) {
    const existing = db.getInspectionFull(req.body.id);
    if (existing && existing.sirdar_id !== user.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only submit your own inspection draft.' });
      return;
    }
  }
  try {
    const submitted = db.submitInspection(req.body, user.id);
    res.status(201).json(submitted);
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    const isValidation = err.message?.includes('VALIDATION_ERROR');
    res.status(isImmutable || isAuth ? 403 : isValidation ? 422 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : isValidation ? 'VALIDATION_FAILED' : 'SUBMISSION_FAILED',
      message: err.message || 'Failed to submit inspection.',
    });
  }
});

app.post('/api/inspections/:id/submit', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (user.role !== 'SIRDAR') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Mining Sirdars can submit statutory shift inspections.' });
    return;
  }
  const existing = db.getInspectionFull(id);
  if (existing && existing.sirdar_id !== user.id) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only submit your own inspection draft.' });
    return;
  }
  try {
    const payload = { ...req.body, id };
    const submitted = db.submitInspection(payload, user.id);
    res.status(200).json(submitted);
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    const isValidation = err.message?.includes('VALIDATION_ERROR');
    res.status(isImmutable || isAuth ? 403 : isValidation ? 422 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : isValidation ? 'VALIDATION_FAILED' : 'SUBMISSION_FAILED',
      message: err.message || 'Failed to submit inspection.',
    });
  }
});

// 9. Delete Draft (Strictly rejected if inspection is submitted)
app.delete('/api/inspections/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (user.role !== 'SIRDAR') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Mining Sirdars can delete inspection drafts.' });
    return;
  }
  const existing = db.getInspectionFull(id);
  if (existing && existing.sirdar_id !== user.id) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only delete your own draft.' });
    return;
  }
  try {
    const success = db.deleteDraft(id, user.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Draft not found.' });
      return;
    }
    res.json({ success: true, message: 'Draft deleted.' });
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isImmutable || isAuth ? 403 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : 'DELETE_FAILED',
      message: err.message || 'Failed to delete record.',
    });
  }
});

// ================= OVERMAN (PHASE 2) STATUTORY ROUTES =================

// 10. Overman Assignment & Current Shift
app.get('/api/overman/assignment', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen have Overman statutory assignments.' });
    return;
  }
  const assignment = db.getOvermanAssignment(user.id);
  if (!assignment) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No Overman assignment found for this user.' });
    return;
  }
  res.json(assignment);
});

// 11. Received Sirdar Inspections for Overman District
app.get('/api/overman/sirdar-inspections', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can access Overman statutory inspection views.' });
    return;
  }
  try {
    const list = db.getReceivedSirdarInspections(user.id);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to fetch received inspections.' });
  }
});

// 12. Overman Reports List
app.get('/api/overman/reports', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can access Overman reports.' });
    return;
  }
  try {
    const reports = db.getOvermanReports(user.id);
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to fetch Overman reports.' });
  }
});

// 13. Single Overman Report Detail
app.get('/api/overman/reports/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can access Overman reports.' });
    return;
  }
  try {
    const report = db.getOvermanReportById(id);
    if (!report) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Overman report not found.' });
      return;
    }
    // An Overman can only view reports within their authorized scope (own reports)
    if (report.overman_id !== user.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You may only view your own Overman reports.' });
      return;
    }
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to fetch report.' });
  }
});

// 14. Create or Get Overman Draft Report
app.post('/api/overman/draft', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can create Overman report drafts.' });
    return;
  }
  try {
    const draft = db.createOrGetOvermanDraft(user.id, req.body);
    res.status(200).json(draft);
  } catch (err: any) {
    res.status(400).json({ error: 'BAD_REQUEST', message: err.message || 'Failed to create/get Overman draft.' });
  }
});

// 15. Assemble Overman Report from explicitly selected submitted Sirdar records
app.post('/api/overman/assemble/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can assemble Overman reports.' });
    return;
  }
  const report = db.getOvermanReportById(id);
  if (!report) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Overman report not found.' });
    return;
  }
  if (report.overman_id !== user.id) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only assemble your own Overman reports.' });
    return;
  }
  if (report.status === 'SUBMITTED') {
    res.status(403).json({ error: 'IMMUTABLE_RECORD', message: 'Submitted Overman report is immutable and cannot be re-assembled.' });
    return;
  }
  try {
    const assembled = db.assembleOvermanReport(id, user.id);
    res.status(200).json(assembled);
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isImmutable || isAuth ? 403 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : 'BAD_REQUEST',
      message: err.message || 'Failed to assemble Overman report.',
    });
  }
});

// 16. Update Overman Report (Overman-specific fields & remarks)
app.put('/api/overman/reports/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can update Overman reports.' });
    return;
  }
  const report = db.getOvermanReportById(id);
  if (!report) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Overman report not found.' });
    return;
  }
  if (report.overman_id !== user.id) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only update your own Overman reports.' });
    return;
  }
  if (report.status === 'SUBMITTED') {
    res.status(403).json({ error: 'IMMUTABLE_RECORD', message: 'Submitted Overman report is immutable and cannot be modified.' });
    return;
  }
  try {
    const updated = db.updateOvermanReport(id, user.id, req.body);
    res.status(200).json(updated);
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isImmutable || isAuth ? 403 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : 'BAD_REQUEST',
      message: err.message || 'Failed to update Overman report.',
    });
  }
});

// 17. Submit Overman Report (Creates permanent immutable statutory record)
app.post('/api/overman/reports/:id/submit', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (user.role !== 'OVERMAN') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Only Overmen can submit Overman reports.' });
    return;
  }
  const report = db.getOvermanReportById(id);
  if (!report) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Overman report not found.' });
    return;
  }
  if (report.overman_id !== user.id) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. You can only submit your own Overman reports.' });
    return;
  }
  if (report.status === 'SUBMITTED') {
    res.status(403).json({ error: 'IMMUTABLE_RECORD', message: 'Report has already been submitted and sealed.' });
    return;
  }
  try {
    const submitted = db.submitOvermanReport(id, user.id, req.body);
    res.status(200).json(submitted);
  } catch (err: any) {
    const isImmutable = err.message?.includes('IMMUTABLE_ERROR');
    const isAuth = err.message?.includes('AUTH_ERROR');
    res.status(isImmutable || isAuth ? 403 : 400).json({
      error: isImmutable ? 'IMMUTABLE_RECORD' : isAuth ? 'FORBIDDEN' : 'SUBMISSION_FAILED',
      message: err.message || 'Failed to submit Overman report.',
    });
  }
});

// ================= FRONTEND / VITE SETUP =================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[MINE SIRDAR APP] Server running on http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
