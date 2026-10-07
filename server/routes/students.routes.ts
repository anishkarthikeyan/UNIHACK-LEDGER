import { Router } from 'express';
import { z } from 'zod';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest, STUDENT_DATA_ROLES } from '../middleware/auth';
import { studentDetail, studentLookup } from '../services/analytics/cohortAnalytics';

// Student lookup. Every caller gets only the students inside their scope (server/lib/scope.ts):
// a Faculty Advisor their assigned sections, an SDE Coordinator SDE students only, the HOD the
// whole department. Students get 403 — this is a staff endpoint.
export const studentsRoutes = Router();

export const cohortFilterSchema = z.object({
  batch: z.coerce.number().int().min(2000).max(2100).optional(),
  section: z.string().regex(/^[A-Z]{1,2}$/).optional(),
  sde: z.enum(['SDE', 'Non-SDE']).optional(),
});

studentsRoutes.get('/students', authenticate, allow(...STUDENT_DATA_ROLES), ah(async (req: AuthRequest, res) => {
  const input = cohortFilterSchema.extend({ search: z.string().max(100).optional() }).safeParse(req.query);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const q = input.data;
  res.json(await studentLookup(req.user!, { batchYear: q.batch, section: q.section, sdeStatus: q.sde, search: q.search }));
}));

studentsRoutes.get('/students/:id', authenticate, allow(...STUDENT_DATA_ROLES), ah(async (req: AuthRequest, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid student id.' });
  const detail = await studentDetail(req.user!, req.params.id);
  // 404 rather than 403 for out-of-scope students, so the endpoint can't be used to probe which ids exist.
  if (!detail) return res.status(404).json({ error: 'Student not found.' });
  res.json(detail);
}));
