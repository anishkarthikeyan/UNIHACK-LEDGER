import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { audit } from '../lib/audit';
import { ah } from '../middleware/asyncHandler';
import { allow, authenticate, AuthRequest, STUDENT_DATA_ROLES } from '../middleware/auth';
import { isUuid } from '../lib/validation';
import { studentIdInScopeSql, teamInScopeSql } from '../lib/scope';
import { services } from '../services';

// Behavior unchanged from the original monolithic server/index.ts, moved verbatim, with the
// notification INSERTs (invite, join-request created/responded) routed through
// services.notifications.notify() instead of raw queries.
export const teamsRoutes = Router();

teamsRoutes.get('/teams/mine', authenticate, ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT t.*, tm.member_role, tm.status, COUNT(active.user_id)::int AS member_count FROM teams t
    JOIN team_members tm ON tm.team_id = t.id LEFT JOIN team_members active ON active.team_id = t.id AND active.status = 'active'
    WHERE tm.user_id = $1 GROUP BY t.id, tm.member_role, tm.status ORDER BY t.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

teamsRoutes.get('/teams', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`SELECT t.*, COUNT(tm.user_id) FILTER (WHERE tm.status = 'active')::int AS member_count FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id
    WHERE t.visibility = 'public' AND t.join_mode IN ('open', 'request')
    AND NOT EXISTS (SELECT 1 FROM team_members me WHERE me.team_id = t.id AND me.user_id = $1 AND me.status != 'declined')
    GROUP BY t.id HAVING COUNT(tm.user_id) FILTER (WHERE tm.status = 'active') < t.max_members
    ORDER BY t.created_at DESC`, [req.user!.id]);
  res.json(rows);
}));

// Staff see teams with at least one active member inside their scope — members may come from
// other sections, and every member is listed (with section and SDE status) so the advisor sees
// the whole team, with `in_scope` marking their own students. Each team carries the hackathons
// it registered for and its logged results.
teamsRoutes.get('/teams/all', authenticate, allow(...STUDENT_DATA_ROLES), ah(async (req: AuthRequest, res) => {
  const role = req.user!.role;
  const { rows } = await pool.query(`SELECT t.*,
      COALESCE(m.member_count, 0) AS member_count, COALESCE(m.members, '[]'::jsonb) AS members, COALESCE(m.sections, '{}') AS sections,
      COALESCE(r.hackathons, '[]'::jsonb) AS hackathons, COALESCE(a.results, '[]'::jsonb) AS results,
      COALESCE(a.wins, 0) AS wins
    FROM teams t
    LEFT JOIN LATERAL (
      SELECT COUNT(*) FILTER (WHERE tm.status = 'active')::int AS member_count,
        array_agg(DISTINCT sp.section) FILTER (WHERE tm.status = 'active' AND sp.section IS NOT NULL) AS sections,
        jsonb_agg(jsonb_build_object('user_id', u.id, 'full_name', u.full_name, 'institutional_id', u.institutional_id,
          'section', sp.section, 'sde_status', sp.sde_status, 'member_role', tm.member_role, 'status', tm.status,
          'in_scope', ${studentIdInScopeSql(role, '$1', 'u.id')})
          ORDER BY (tm.member_role = 'leader') DESC, u.institutional_id) AS members
      FROM team_members tm JOIN users u ON u.id = tm.user_id LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE tm.team_id = t.id AND tm.status IN ('active', 'invited')
    ) m ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object('registration_id', reg.id, 'hackathon_id', h.id, 'title', h.title, 'hackathon_status', h.status,
          'registration_status', reg.status, 'registration_closes_at', h.registration_closes_at) ORDER BY h.registration_closes_at DESC NULLS LAST) AS hackathons
      FROM registrations reg JOIN hackathons h ON h.id = reg.hackathon_id WHERE reg.team_id = t.id
    ) r ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object('id', ach.id, 'title', ach.title, 'outcome', ach.outcome, 'result', ach.result, 'status', ach.status,
          'hackathon_id', ach.hackathon_id, 'hackathon_title', h.title, 'achieved_on', ach.achieved_on) ORDER BY ach.achieved_on DESC NULLS LAST) AS results,
        COUNT(*) FILTER (WHERE ach.status = 'approved' AND ach.result IN ('winner', 'runner_up'))::int AS wins
      FROM achievements ach LEFT JOIN hackathons h ON h.id = ach.hackathon_id WHERE ach.team_id = t.id
    ) a ON true
    WHERE ${teamInScopeSql(role, '$1', 't.id')}
    ORDER BY a.wins DESC NULLS LAST, t.name`, [req.user!.id]);
  res.json(rows);
}));

teamsRoutes.get('/teams/invites/mine', authenticate, ah(async (req: AuthRequest, res) => {
  // invited_by IS NOT NULL excludes this student's own pending join-requests (see
  // /teams/:id/request-join) — those are awaiting the team leader's decision, not this
  // student's, and belong in /teams/:id/join-requests instead.
  const { rows } = await pool.query(`SELECT t.id AS team_id, t.name, t.description, t.max_members FROM team_members tm
    JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = $1 AND tm.status = 'invited' AND tm.invited_by IS NOT NULL`, [req.user!.id]);
  res.json(rows);
}));

// Team detail (roster incl. emails): the team's own members/invitees, students browsing a public
// team, staff whose scope covers an active member, or admin. Anyone else gets 404.
teamsRoutes.get('/teams/:id', authenticate, ah(async (req: AuthRequest, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const viewer = req.user!;
  const team = (await pool.query(`SELECT t.* FROM teams t WHERE t.id = $1 AND (
      EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = t.id AND m.user_id = $2)
      OR ($3::text = 'student' AND t.visibility = 'public')
      OR ${STUDENT_DATA_ROLES.includes(viewer.role) ? teamInScopeSql(viewer.role, '$2', 't.id') : 'FALSE'})`,
    [req.params.id, viewer.id, viewer.role])).rows[0];
  if (!team) return res.status(404).json({ error: 'Team not found.' });
  const { rows: members } = await pool.query(`SELECT tm.user_id, tm.member_role, tm.status, tm.joined_at, u.full_name, u.email
    FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 ORDER BY tm.member_role DESC, tm.joined_at ASC`, [req.params.id]);
  res.json({ ...team, members });
}));

teamsRoutes.post('/teams/:id/join', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const team = (await client.query('SELECT * FROM teams WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
    if (!team || team.join_mode !== 'open') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'This team is not open to join.' }); }
    const { rows: count } = await client.query(`SELECT COUNT(*)::int AS n FROM team_members WHERE team_id = $1 AND status = 'active'`, [team.id]);
    if (count[0].n >= team.max_members) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'This team is already full.' }); }
    await client.query(`INSERT INTO team_members (team_id, user_id, member_role, status, joined_at) VALUES ($1,$2,'member','active',now())
      ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'active', joined_at = now()`, [team.id, req.user!.id]);
    await client.query('COMMIT');
    await audit(req.user!.id, 'join', 'team', team.id);
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

teamsRoutes.post('/teams/:id/invite', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ institutionalId: z.string().min(1) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const team = (await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id])).rows[0];
  if (!team) return res.status(404).json({ error: 'Team not found.' });
  const isLeader = (await pool.query(`SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND member_role = 'leader'`, [req.params.id, req.user!.id])).rowCount;
  if (!isLeader) return res.status(403).json({ error: 'Only the team leader can invite members.' });
  const invitee = (await pool.query(`SELECT id FROM users WHERE institutional_id = $1 AND role = 'student'`, [input.data.institutionalId])).rows[0];
  if (!invitee) return res.status(404).json({ error: 'No student found with that institutional ID.' });
  await pool.query(`INSERT INTO team_members (team_id, user_id, member_role, status, invited_by) VALUES ($1,$2,'member','invited',$3)
    ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'invited', invited_by = $3`, [req.params.id, invitee.id, req.user!.id]);
  await services.notifications.notify({ recipientId: invitee.id, type: 'team_invite', title: 'Team invitation', body: `You've been invited to join ${team.name}.`, actionUrl: '/teams' });
  await audit(req.user!.id, 'invite', 'team', team.id, { invitee: invitee.id });
  res.status(204).end();
}));

teamsRoutes.post('/teams/:id/respond', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ accept: z.boolean() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const status = input.data.accept ? 'active' : 'declined';
  // $3 is cast explicitly in both spots: used bare, Postgres tries to unify one occurrence as
  // membership_status (from the SET target column) and the other as text (bare '=' comparison)
  // and fails to parse the query at all ("inconsistent types deduced for parameter") — this was
  // a pre-existing bug that made every invite-accept 500 (rediscovered and fixed in Phase 1).
  const result = await pool.query(`UPDATE team_members SET status = $3::membership_status, joined_at = CASE WHEN $3::text = 'active' THEN now() ELSE joined_at END
    WHERE team_id = $1 AND user_id = $2 AND status = 'invited' AND invited_by IS NOT NULL`, [req.params.id, req.user!.id, status]);
  if (!result.rowCount) return res.status(404).json({ error: 'Invitation not found.' });
  res.status(204).end();
}));

// --- Request-to-join (join_mode = 'request'): the student initiates, the leader decides. ---
// Reuses membership_status 'invited' with invited_by = NULL as the "pending request" marker,
// so it flows through the same status lifecycle as an invite without a new enum value.
teamsRoutes.post('/teams/:id/request-join', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const team = (await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id])).rows[0];
  if (!team) return res.status(404).json({ error: 'Team not found.' });
  if (team.join_mode !== 'request') return res.status(400).json({ error: 'This team does not accept join requests.' });
  const existing = (await pool.query('SELECT status FROM team_members WHERE team_id = $1 AND user_id = $2', [req.params.id, req.user!.id])).rows[0];
  if (existing?.status === 'active') return res.status(400).json({ error: 'You are already on this team.' });
  if (existing?.status === 'invited') return res.status(400).json({ error: 'You already have a pending request for this team.' });
  await pool.query(`INSERT INTO team_members (team_id, user_id, member_role, status, invited_by) VALUES ($1,$2,'member','invited',NULL)
    ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'invited', invited_by = NULL`, [req.params.id, req.user!.id]);
  const leader = (await pool.query(`SELECT user_id FROM team_members WHERE team_id = $1 AND member_role = 'leader'`, [req.params.id])).rows[0];
  if (leader) {
    await services.notifications.notify({ recipientId: leader.user_id, type: 'team_join_request', title: 'New join request', body: `A student requested to join ${team.name}.`, actionUrl: '/teams' });
  }
  await audit(req.user!.id, 'request_join', 'team', team.id);
  res.status(204).end();
}));

teamsRoutes.get('/teams/:id/join-requests', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const isLeader = (await pool.query(`SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND member_role = 'leader'`, [req.params.id, req.user!.id])).rowCount;
  if (!isLeader) return res.status(403).json({ error: 'Only the team leader can view join requests.' });
  const { rows } = await pool.query(`SELECT tm.user_id, u.full_name, u.email, u.institutional_id FROM team_members tm
    JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 AND tm.status = 'invited' AND tm.invited_by IS NULL`, [req.params.id]);
  res.json(rows);
}));

teamsRoutes.post('/teams/:id/join-requests/:userId/respond', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ accept: z.boolean() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const team = (await client.query('SELECT * FROM teams WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
    if (!team) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Team not found.' }); }
    const isLeader = (await client.query(`SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND member_role = 'leader'`, [req.params.id, req.user!.id])).rowCount;
    if (!isLeader) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Only the team leader can respond to join requests.' }); }
    if (input.data.accept) {
      const { rows: count } = await client.query(`SELECT COUNT(*)::int AS n FROM team_members WHERE team_id = $1 AND status = 'active'`, [team.id]);
      if (count[0].n >= team.max_members) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'This team is already full.' }); }
    }
    const status = input.data.accept ? 'active' : 'declined';
    // Only 3 distinct values actually appear in this query. Postgres requires every bound
    // parameter to be referenced somewhere in the SQL text to infer its type ("could not
    // determine data type of parameter") — the leader identity is already verified above and
    // isn't needed in this statement, so it must not be passed as an unused bind parameter.
    const result = await client.query(`UPDATE team_members SET status = $3::membership_status, joined_at = CASE WHEN $3::text = 'active' THEN now() ELSE joined_at END
      WHERE team_id = $1 AND user_id = $2 AND status = 'invited' AND invited_by IS NULL RETURNING user_id`, [req.params.id, req.params.userId, status]);
    if (!result.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Join request not found.' }); }
    await client.query('COMMIT');
    await audit(req.user!.id, input.data.accept ? 'accept_join_request' : 'decline_join_request', 'team', req.params.id, { userId: req.params.userId });
    await services.notifications.notify({
      recipientId: req.params.userId, type: 'team_join_request',
      title: input.data.accept ? 'Join request approved' : 'Join request declined',
      body: `Your request to join ${team.name} was ${input.data.accept ? 'approved' : 'declined'}.`, actionUrl: '/teams',
    });
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

// --- Leave / remove / disband ---
teamsRoutes.delete('/teams/:id/members/:userId', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const isSelf = req.params.userId === req.user!.id;
  const membership = (await pool.query(`SELECT member_role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = 'active'`, [req.params.id, req.user!.id])).rows[0];
  if (!membership) return res.status(403).json({ error: 'You are not an active member of this team.' });

  if (isSelf) {
    if (membership.member_role === 'leader') {
      return res.status(400).json({ error: 'Team leaders cannot leave directly — transfer leadership isn\'t supported yet, so disband the team instead if you need to step away.' });
    }
  } else {
    if (membership.member_role !== 'leader') return res.status(403).json({ error: 'Only the team leader can remove other members.' });
  }

  const result = await pool.query(`UPDATE team_members SET status = 'removed' WHERE team_id = $1 AND user_id = $2 AND status = 'active' RETURNING user_id`, [req.params.id, req.params.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Member not found on this team.' });
  await audit(req.user!.id, isSelf ? 'leave' : 'remove_member', 'team', req.params.id, { userId: req.params.userId });
  res.status(204).end();
}));

teamsRoutes.delete('/teams/:id', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const isLeader = (await pool.query(`SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND member_role = 'leader' AND status = 'active'`, [req.params.id, req.user!.id])).rowCount;
  if (!isLeader) return res.status(403).json({ error: 'Only the team leader can disband this team.' });
  const registered = (await pool.query('SELECT 1 FROM registrations WHERE team_id = $1 LIMIT 1', [req.params.id])).rowCount;
  if (registered) return res.status(400).json({ error: 'This team has hackathon registrations on record and cannot be disbanded. Withdraw its registrations first.' });
  const result = await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Team not found.' });
  await audit(req.user!.id, 'disband', 'team', req.params.id);
  res.status(204).end();
}));

teamsRoutes.post('/teams', authenticate, allow('student'), ah(async (req: AuthRequest, res) => {
  const input = z.object({ name: z.string().min(2), description: z.string().max(2000).optional(), maxMembers: z.number().int().min(2).max(20), visibility: z.enum(['public', 'private']).default('public'), joinMode: z.enum(['invite', 'request', 'open']).default('invite'), domains: z.array(z.string()).default([]), techStack: z.array(z.string()).default([]) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: input.error.issues });
  const client = await pool.connect();
  try { await client.query('BEGIN'); const x = input.data;
    const team = (await client.query('INSERT INTO teams (name, description, max_members, visibility, join_mode, domains, tech_stack, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [x.name, x.description ?? null, x.maxMembers, x.visibility, x.joinMode, x.domains, x.techStack, req.user!.id])).rows[0];
    await client.query("INSERT INTO team_members (team_id, user_id, member_role, status, joined_at) VALUES ($1,$2,'leader','active',now())", [team.id, req.user!.id]);
    await client.query('COMMIT'); await audit(req.user!.id, 'create', 'team', team.id); res.status(201).json(team);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));
