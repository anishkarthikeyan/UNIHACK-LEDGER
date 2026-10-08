import type {
  Achievement,
  AdminScopeAssignment,
  CohortFilters,
  CohortHackathon,
  CohortSummary,
  Role,
  StudentDetail,
  AdminDashboardSummary,
  AdminUser,
  AuditLog,
  AuthUser,
  CreateAchievementInput,
  CreateHackathonInput,
  CreateProjectInput,
  CreateReminderInput,
  CreateRegistrationInput,
  CreateRoundInput,
  CreateTeamInput,
  Department,
  Hackathon,
  HackathonCategory,
  HackathonRound,
  Notification,
  Organizer,
  Project,
  Registration,
  Reminder,
  ReportSummary,
  Student,
  Suggestion,
  SuggestionInput,
  SubmitProjectReviewInput,
  StaffTeam,
  Team,
  TeamDetail,
  TeamInvite,
  StudentLookup,
  TeamJoinRequest,
  UpdateHackathonInput,
  UpdateProfileInput,
  UpdateRoundInput,
} from '../types';

const TOKEN_STORAGE_KEY = 'unihack.token';

// Defaults to the relative '/api' path, which is correct for the web app in every environment
// (Vite's dev proxy locally; a same-origin reverse proxy in a real deployment). A bundled mobile
// build has no dev-proxy origin to be relative to — set VITE_API_BASE_URL at build time (e.g.
// `VITE_API_BASE_URL=https://api.yourdomain.com npm run build`) to point it at a real deployed
// API before running `npx cap sync` for a release build. See capacitor.config.ts and
// .env.example for the full picture of what a mobile release build needs configured.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    // A 401 on a request that carried an existing token means that session was actually
    // rejected (expired/revoked) — log the user out and say so. A 401 on a request with no
    // token (e.g. a failed /auth/login attempt) isn't a session expiring at all; it's the
    // credentials being rejected, so surface the backend's own message instead of this generic
    // one, which was previously shown even for a plain wrong password.
    if (token) {
      onUnauthorized?.();
      throw new ApiError(401, 'Your session has expired. Please log in again.');
    }
    const isJson401 = res.headers.get('content-type')?.includes('application/json');
    const data401 = isJson401 ? await res.json() : undefined;
    const message401 = typeof data401?.error === 'string' ? data401.error : 'Invalid email or password.';
    throw new ApiError(401, message401);
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : Array.isArray(data?.error) ? data.error[0]?.message ?? 'Request failed.' : 'Request failed.';
    throw new ApiError(res.status, message);
  }

  // A 2xx status without a JSON body means this response didn't actually come from the API —
  // e.g. a captive portal, a dev-server proxy failure, or (on a packaged mobile build) the
  // app falling back to its bundled local assets and getting its own index.html back for an
  // unmatched path. Treat that as a failure instead of silently resolving to `undefined`,
  // which would otherwise crash the first place the caller destructures the response.
  if (!isJson) {
    throw new ApiError(res.status, 'Received an unexpected response from the server. Check that the app can reach the API and try again.');
  }

  return data as T;
}

// Multipart upload — deliberately bypasses `request()`'s JSON handling: FormData must not get a
// manually-set Content-Type, the browser sets one with the correct multipart boundary itself.
async function postForm<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', body: form, headers });
  if (res.status === 401) { setToken(null); onUnauthorized?.(); throw new ApiError(401, 'Your session has expired. Please log in again.'); }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : Array.isArray(data?.error) ? data.error[0]?.message ?? 'Request failed.' : 'Request failed.';
    throw new ApiError(res.status, message);
  }
  return data as T;
}

// Downloads a file that requires the Authorization header (a plain <a href> can't send one) as
// a blob, then hands the browser a same-origin blob: URL to open/download — used for certificate
// preview/download in both FacultyReviewVerify and StudentAchievements.
async function fetchBlob(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (res.status === 401) { setToken(null); onUnauthorized?.(); throw new ApiError(401, 'Your session has expired. Please log in again.'); }
  if (!res.ok) throw new ApiError(res.status, 'Failed to download the file.');
  const disposition = res.headers.get('content-disposition');
  const filename = disposition?.match(/filename="([^"]*)"/)?.[1] ?? null;
  return { blob: await res.blob(), filename };
}

function queryString(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function get<T>(path: string) {
  return request<T>(path);
}
function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
}
function patch<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
}
function put<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });
}
function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

export const api = {
  auth: {
    login: (email: string, password: string) => post<{ token: string; user: { id: string; email: string; name: string; role: string; institutionalId: string } }>('/auth/login', { email, password }),
    me: () => get<AuthUser>('/auth/me'),
    forgotPassword: (email: string) => post<void>('/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) => post<void>('/auth/reset-password', { token, newPassword }),
  },
  hackathons: {
    list: (search?: string) => get<Hackathon[]>(`/hackathons${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get: (id: string) => get<Hackathon>(`/hackathons/${id}`),
    create: (input: CreateHackathonInput) => post<Hackathon>('/hackathons', input),
    update: (id: string, input: UpdateHackathonInput) => patch<Hackathon>(`/hackathons/${id}`, input),
    registrations: (id: string) => get<Registration[]>(`/hackathons/${id}/registrations`),
    markInterested: (id: string) => post<void>(`/hackathons/${id}/interest`),
    removeInterest: (id: string) => del<void>(`/hackathons/${id}/interest`),
    bookmark: (id: string) => post<void>(`/hackathons/${id}/bookmark`),
    removeBookmark: (id: string) => del<void>(`/hackathons/${id}/bookmark`),
    addRound: (id: string, input: CreateRoundInput) => post<HackathonRound>(`/hackathons/${id}/rounds`, input),
    updateRound: (id: string, roundId: string, input: UpdateRoundInput) => patch<HackathonRound>(`/hackathons/${id}/rounds/${roundId}`, input),
    removeRound: (id: string, roundId: string) => del<void>(`/hackathons/${id}/rounds/${roundId}`),
    setCategories: (id: string, categoryIds: string[]) => put<void>(`/hackathons/${id}/categories`, { categoryIds }),
    setOrganizers: (id: string, organizerIds: string[]) => put<void>(`/hackathons/${id}/organizers`, { organizerIds }),
    setEligibility: (id: string, years: number[], labels: string[]) => put<void>(`/hackathons/${id}/eligibility`, { years, labels }),
  },
  categories: {
    list: () => get<HackathonCategory[]>('/categories'),
    create: (name: string) => post<HackathonCategory>('/categories', { name }),
  },
  organizers: {
    list: () => get<Organizer[]>('/organizers'),
    create: (name: string) => post<Organizer>('/organizers', { name }),
  },
  bookmarks: {
    mine: () => get<Hackathon[]>('/bookmarks/mine'),
  },
  teams: {
    mine: () => get<Team[]>('/teams/mine'),
    joinable: () => get<Team[]>('/teams'),
    all: () => get<StaffTeam[]>('/teams/all'),
    get: (id: string) => get<TeamDetail>(`/teams/${id}`),
    create: (input: CreateTeamInput) => post<Team>('/teams', input),
    join: (id: string) => post<void>(`/teams/${id}/join`),
    lookupMember: (regNo: string) => get<StudentLookup>(`/teams/member-lookup/${encodeURIComponent(regNo)}`),
    invite: (id: string, institutionalId: string) => post<void>(`/teams/${id}/invite`, { institutionalId }),
    invitesMine: () => get<TeamInvite[]>('/teams/invites/mine'),
    respond: (id: string, accept: boolean) => post<void>(`/teams/${id}/respond`, { accept }),
    requestJoin: (id: string) => post<void>(`/teams/${id}/request-join`),
    joinRequests: (id: string) => get<TeamJoinRequest[]>(`/teams/${id}/join-requests`),
    respondJoinRequest: (id: string, userId: string, accept: boolean) => post<void>(`/teams/${id}/join-requests/${userId}/respond`, { accept }),
    removeMember: (id: string, userId: string) => del<void>(`/teams/${id}/members/${userId}`),
    disband: (id: string) => del<void>(`/teams/${id}`),
  },
  registrations: {
    mine: () => get<Registration[]>('/registrations/mine'),
    create: (input: CreateRegistrationInput) => post<Registration>('/registrations', input),
    list: (status?: string) => get<Registration[]>(`/registrations${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    review: (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => patch<Registration>(`/registrations/${id}`, { status, rejectionReason }),
  },
  projects: {
    mine: () => get<Project[]>('/projects/mine'),
    all: () => get<Project[]>('/projects/all'),
    showcase: () => get<Project[]>('/projects/showcase'),
    get: (id: string) => get<Project>(`/projects/${id}`),
    create: (input: CreateProjectInput) => post<Project>('/projects', input),
    review: (id: string, input: SubmitProjectReviewInput) => post<unknown>(`/projects/${id}/review`, input),
  },
  suggestions: {
    create: (input: SuggestionInput) => post<unknown>('/suggestions', input),
    list: (status?: string) => get<Suggestion[]>(`/suggestions${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    review: (id: string, status: 'under_review' | 'approved' | 'rejected', reviewNotes?: string) => patch<Suggestion>(`/suggestions/${id}`, { status, reviewNotes }),
  },
  notifications: {
    list: () => get<Notification[]>('/notifications'),
    markRead: (id: string) => patch<Notification>(`/notifications/${id}/read`),
    markAllRead: () => patch<void>('/notifications/read-all'),
    remove: (id: string) => del<void>(`/notifications/${id}`),
    registerPushToken: (token: string, platform: 'android' | 'ios' | 'web') => post<void>('/notifications/push-token', { token, platform }),
    removePushToken: (token: string) => del<void>(`/notifications/push-token/${encodeURIComponent(token)}`),
  },
  users: {
    updateMe: (input: UpdateProfileInput) => patch<AuthUser>('/users/me', input),
  },
  achievements: {
    mine: () => get<Achievement[]>('/achievements/mine'),
    create: (input: CreateAchievementInput) => post<Achievement>('/achievements', input),
    list: (status?: string) => get<Achievement[]>(`/achievements${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    verify: (id: string, status: 'approved' | 'rejected' | 'changes_requested', reviewNotes?: string) => patch<Achievement>(`/achievements/${id}`, { status, reviewNotes }),
    uploadCertificate: (id: string, file: File) => { const form = new FormData(); form.set('file', file); return postForm<Achievement>(`/achievements/${id}/certificate`, form); },
    certificate: (id: string) => fetchBlob(`/achievements/${id}/certificate`),
  },
  reminders: {
    mine: () => get<Reminder[]>('/reminders/mine'),
    create: (input: CreateReminderInput) => post<Reminder>('/reminders', input),
    remove: (id: string) => del<void>(`/reminders/${id}`),
  },
  students: {
    list: (search?: string, filters: CohortFilters = {}) => get<Student[]>(`/students${queryString({ search, ...filters })}`),
    get: (id: string) => get<StudentDetail>(`/students/${id}`),
  },
  cohort: {
    summary: (filters: CohortFilters = {}) => get<CohortSummary>(`/cohort/summary${queryString({ ...filters })}`),
    hackathons: (filters: CohortFilters = {}) => get<CohortHackathon[]>(`/cohort/hackathons${queryString({ ...filters })}`),
  },
  reports: {
    summary: () => get<ReportSummary>('/reports/summary'),
  },
  admin: {
    dashboard: () => get<AdminDashboardSummary>('/admin/dashboard'),
    users: (params?: { search?: string; role?: string }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.role) qs.set('role', params.role);
      const query = qs.toString();
      return get<AdminUser[]>(`/admin/users${query ? `?${query}` : ''}`);
    },
    createUser: (input: { institutionalId: string; email: string; fullName: string; role: Role; departmentCode?: string }) => post<AdminUser>('/admin/users', input),
    updateUser: (id: string, input: { fullName?: string; status?: 'active' | 'inactive' | 'suspended'; role?: Role; confirmed?: boolean }) => patch<AdminUser>(`/admin/users/${id}`, input),
    auditLogs: (search?: string) => get<AuditLog[]>(`/admin/audit-logs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    departments: () => get<Department[]>('/admin/departments'),
    createDepartment: (code: string, name: string) => post<Department>('/admin/departments', { code, name }),
    updateDepartment: (id: string, input: { code?: string; name?: string }) => patch<Department>(`/admin/departments/${id}`, input),
    deleteDepartment: (id: string) => del<void>(`/admin/departments/${id}`),
    scopeAssignments: (userId?: string) => get<AdminScopeAssignment[]>(`/admin/scope-assignments${queryString({ userId })}`),
    createScopeAssignment: (input: { userId: string; departmentCode: string; batchYear?: number | null; section?: string | null }) => post<AdminScopeAssignment>('/admin/scope-assignments', input),
    deleteScopeAssignment: (id: string) => del<void>(`/admin/scope-assignments/${id}`),
    settings: () => get<Record<string, unknown>>('/admin/settings'),
    updateSettings: (settings: Record<string, unknown>) => put<Record<string, unknown>>('/admin/settings', settings),
  },
};
