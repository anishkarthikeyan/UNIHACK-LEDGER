import { Router } from 'express';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest, STUDENT_DATA_ROLES } from '../middleware/auth';
import { scopeAssignmentsOf } from '../lib/scope';
import {
  cohortTotals, hackathonParticipation, participationBySde, participationBySection, sectionBreakdown,
} from '../services/analytics/cohortAnalytics';
import { cohortFilterSchema } from './students.routes';

// Cohort analytics for Faculty Advisors, Coordinators, SDE Coordinators, the HOD and admin.
// All numbers are computed over the caller's scope only — the same endpoint returns a section's
// numbers to its advisor and the whole department to the HOD.
export const cohortRoutes = Router();

cohortRoutes.get('/cohort/summary', authenticate, allow(...STUDENT_DATA_ROLES), ah(async (req: AuthRequest, res) => {
  const input = cohortFilterSchema.safeParse(req.query);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const f = { batchYear: input.data.batch, section: input.data.section, sdeStatus: input.data.sde };
  const viewer = req.user!;
  const [totals, sections, bySection, bySde, scope] = await Promise.all([
    cohortTotals(viewer, f), sectionBreakdown(viewer, f), participationBySection(viewer, f), participationBySde(viewer, f),
    viewer.role === 'admin' ? Promise.resolve([]) : scopeAssignmentsOf(viewer.id),
  ]);
  res.json({
    role: viewer.role,
    sdeOnly: viewer.role === 'sde_coordinator',
    scope,
    totals,
    sections,
    participationBySection: bySection,
    participationBySde: bySde,
  });
}));

cohortRoutes.get('/cohort/hackathons', authenticate, allow(...STUDENT_DATA_ROLES), ah(async (req: AuthRequest, res) => {
  const input = cohortFilterSchema.safeParse(req.query);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  res.json(await hackathonParticipation(req.user!, { batchYear: input.data.batch, section: input.data.section, sdeStatus: input.data.sde }));
}));
