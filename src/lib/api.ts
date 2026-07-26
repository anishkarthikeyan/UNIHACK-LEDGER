import type {
  Achievement,
  AdminDashboardSummary,
  AdminUser,
  AuditLog,
  AuthUser,
  CreateAchievementInput,
  CreateHackathonInput,
  CreateProjectInput,
  CreateReminderInput,
  CreateRegistrationInput,
  CreateTeamInput,
  Department,
  Hackathon,
  Notification,
  Project,
  Registration,
  Reminder,
  ReportSummary,
  Student,
  Suggestion,
  SuggestionInput,
  SubmitProjectReviewInput,
  Team,
  TeamInvite,
  UpdateHackathonInput,
  UpdateProfileInput,
} from '../types';

const TOKEN_STORAGE_KEY = 'unihack.token';

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

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    onUnauthorized?.();
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : Array.isArray(data?.error) ? data.error[0]?.message ?? 'Request failed.' : 'Request failed.';
    throw new ApiError(res.status, message);
  }

  return data as T;
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
  },
  hackathons: {
    list: (search?: string) => get<Hackathon[]>(`/hackathons${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get: (id: string) => get<Hackathon>(`/hackathons/${id}`),
    create: (input: CreateHackathonInput) => post<Hackathon>('/hackathons', input),
    update: (id: string, input: UpdateHackathonInput) => patch<Hackathon>(`/hackathons/${id}`, input),
    registrations: (id: string) => get<Registration[]>(`/hackathons/${id}/registrations`),
    markInterested: (id: string) => post<void>(`/hackathons/${id}/interest`),
    removeInterest: (id: string) => del<void>(`/hackathons/${id}/interest`),
  },
  teams: {
    mine: () => get<Team[]>('/teams/mine'),
    joinable: () => get<Team[]>('/teams'),
    all: () => get<Team[]>('/teams/all'),
    get: (id: string) => get<Team>(`/teams/${id}`),
    create: (input: CreateTeamInput) => post<Team>('/teams', input),
    join: (id: string) => post<void>(`/teams/${id}/join`),
    invite: (id: string, institutionalId: string) => post<void>(`/teams/${id}/invite`, { institutionalId }),
    invitesMine: () => get<TeamInvite[]>('/teams/invites/mine'),
    respond: (id: string, accept: boolean) => post<void>(`/teams/${id}/respond`, { accept }),
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
  },
  users: {
    updateMe: (input: UpdateProfileInput) => patch<AuthUser>('/users/me', input),
  },
  achievements: {
    mine: () => get<Achievement[]>('/achievements/mine'),
    create: (input: CreateAchievementInput) => post<Achievement>('/achievements', input),
    list: (status?: string) => get<Achievement[]>(`/achievements${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    verify: (id: string, status: 'approved' | 'rejected' | 'changes_requested') => patch<Achievement>(`/achievements/${id}`, { status }),
  },
  reminders: {
    mine: () => get<Reminder[]>('/reminders/mine'),
    create: (input: CreateReminderInput) => post<Reminder>('/reminders', input),
    remove: (id: string) => del<void>(`/reminders/${id}`),
  },
  students: {
    list: (search?: string) => get<Student[]>(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
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
    createUser: (input: { institutionalId: string; email: string; fullName: string; role: 'student' | 'faculty' | 'admin'; departmentCode?: string }) => post<AdminUser>('/admin/users', input),
    updateUser: (id: string, input: { fullName?: string; status?: 'active' | 'inactive' | 'suspended'; role?: 'student' | 'faculty' | 'admin' }) => patch<AdminUser>(`/admin/users/${id}`, input),
    auditLogs: (search?: string) => get<AuditLog[]>(`/admin/audit-logs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    departments: () => get<Department[]>('/admin/departments'),
    createDepartment: (code: string, name: string) => post<Department>('/admin/departments', { code, name }),
    updateDepartment: (id: string, input: { code?: string; name?: string }) => patch<Department>(`/admin/departments/${id}`, input),
    deleteDepartment: (id: string) => del<void>(`/admin/departments/${id}`),
    settings: () => get<Record<string, unknown>>('/admin/settings'),
    updateSettings: (settings: Record<string, unknown>) => put<Record<string, unknown>>('/admin/settings', settings),
  },
};
