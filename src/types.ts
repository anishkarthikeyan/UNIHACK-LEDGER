export type Role = 'student' | 'faculty' | 'admin';

export interface AuthUser {
  id: string;
  institutional_id: string;
  email: string;
  full_name: string;
  role: Role;
  status: string;
  avatar_url: string | null;
  programme?: string | null;
  year_of_study?: number | null;
  interests?: string[] | null;
  tech_stack?: string[] | null;
  student_phone?: string | null;
  designation?: string | null;
  faculty_phone?: string | null;
}

export type HackathonStatus = 'draft' | 'pending_review' | 'published' | 'registration_closed' | 'ongoing' | 'completed' | 'archived';

export interface Hackathon {
  id: string;
  title: string;
  slug: string;
  organizer: string;
  organizer_department_id: string | null;
  department_code: string | null;
  coordinator_id: string | null;
  coordinator_name: string | null;
  description: string;
  domains: string[];
  mode: 'online' | 'offline' | 'hybrid';
  venue: string | null;
  official_url: string | null;
  community_url: string | null;
  prize_pool: string | null;
  eligible_years: number[];
  min_team_size: number;
  max_team_size: number;
  solo_allowed: boolean;
  registration_opens_at: string | null;
  registration_closes_at: string;
  starts_at: string | null;
  ends_at: string | null;
  status: HackathonStatus;
  registered_count: number;
  interested_count: number;
  interested: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHackathonInput {
  title: string;
  organizer: string;
  description: string;
  mode: 'online' | 'offline' | 'hybrid';
  registrationClosesAt: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  soloAllowed?: boolean;
  domains?: string[];
  eligibleYears?: number[];
  status?: 'draft' | 'published';
}

export type UpdateHackathonInput = Partial<Pick<CreateHackathonInput, 'title' | 'description' | 'mode' | 'registrationClosesAt'>> & { status?: HackathonStatus };

export interface Team {
  id: string;
  name: string;
  description: string | null;
  domains: string[];
  tech_stack: string[];
  max_members: number;
  visibility: 'public' | 'private';
  join_mode: 'invite' | 'request' | 'open';
  created_by: string;
  created_at: string;
  member_role?: 'leader' | 'member';
  status?: string;
  member_count: number;
  members?: TeamMember[];
}

export interface TeamMember {
  user_id: string;
  member_role: 'leader' | 'member';
  status: string;
  joined_at: string | null;
  full_name: string;
  email: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  maxMembers: number;
  visibility?: 'public' | 'private';
  joinMode?: 'invite' | 'request' | 'open';
  domains?: string[];
  techStack?: string[];
}

export interface Registration {
  id: string;
  hackathon_id: string;
  hackathon_title: string;
  hackathon_status: HackathonStatus;
  registration_closes_at: string;
  starts_at: string | null;
  ends_at: string | null;
  student_id: string | null;
  team_id: string | null;
  team_name: string | null;
  student_name?: string;
  student_email?: string;
  participation_mode: 'solo' | 'team';
  external_registration_url: string | null;
  status: 'draft' | 'submitted' | 'pending_verification' | 'approved' | 'rejected' | 'withdrawn';
  submitted_at: string | null;
  created_at: string;
}

export interface CreateRegistrationInput {
  hackathonId: string;
  participationMode: 'solo' | 'team';
  teamId?: string;
  externalRegistrationUrl?: string;
}

export interface ProjectReview {
  status: 'approved' | 'changes_requested' | 'rejected' | 'pending';
  feedback: string | null;
  score: number | null;
  created_at: string;
  reviewer_name: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  hackathon_id: string | null;
  hackathon_title?: string | null;
  team_id: string | null;
  team_name?: string | null;
  owner_id: string;
  owner_name?: string;
  participation_mode: 'solo' | 'team';
  problem_statement: string;
  description: string;
  tech_stack: string[];
  github_url: string | null;
  demo_url: string | null;
  poster_url: string | null;
  presentation_url: string | null;
  visibility: 'private' | 'institution' | 'public';
  showcase_featured: boolean;
  review_status?: string | null;
  latest_review?: ProjectReview | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitProjectReviewInput {
  status: 'approved' | 'changes_requested' | 'rejected';
  feedback?: string;
  score?: number;
}

export interface CreateProjectInput {
  title: string;
  problemStatement: string;
  description: string;
  participationMode: 'solo' | 'team';
  hackathonId?: string;
  teamId?: string;
  techStack?: string[];
  githubUrl?: string;
  demoUrl?: string;
  posterUrl?: string;
  presentationUrl?: string;
  visibility?: 'private' | 'institution' | 'public';
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface SuggestionInput {
  title: string;
  organizer: string;
  officialUrl: string;
  description: string;
  registrationDeadline?: string;
  eventDateText?: string;
  domain?: string;
  mode?: string;
  tags?: string[];
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  programme?: string;
  yearOfStudy?: number;
  interests?: string[];
  techStack?: string[];
  designation?: string;
}

export interface Achievement {
  id: string;
  student_id: string;
  hackathon_id: string | null;
  hackathon_title?: string | null;
  project_id: string | null;
  project_title?: string | null;
  student_name?: string;
  title: string;
  outcome: string;
  achieved_on: string | null;
  status: 'pending' | 'approved' | 'changes_requested' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface CreateAchievementInput {
  title: string;
  outcome: string;
  hackathonId?: string;
  projectId?: string;
  achievedOn?: string;
}

export interface Reminder {
  id: string;
  created_by: string;
  team_id: string | null;
  team_name?: string | null;
  title: string;
  starts_at: string;
  created_at: string;
}

export interface CreateReminderInput {
  title: string;
  startsAt: string;
  teamId?: string;
}

export interface TeamInvite {
  team_id: string;
  name: string;
  description: string | null;
  max_members: number;
}

export interface Suggestion {
  id: string;
  submitted_by: string;
  submitted_by_name?: string;
  title: string;
  organizer: string;
  official_url: string;
  registration_deadline: string | null;
  event_date_text: string | null;
  domain: string | null;
  mode: string | null;
  tags: string[];
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  review_notes: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  email: string;
  institutional_id: string;
  department_code: string | null;
  year_of_study: number | null;
  project_count: number;
  hackathon_count: number;
}

export interface AdminUser {
  id: string;
  institutional_id: string;
  email: string;
  full_name: string;
  role: Role;
  status: string;
  last_login_at: string | null;
  created_at: string;
  department_code: string | null;
  year_of_study: number | null;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminDashboardSummary {
  totalUsers: number;
  students: number;
  faculty: number;
  admins: number;
  activeHackathons: number;
  totalParticipations: number;
  totalWins: number;
  flaggedActions: number;
  departmentPerformance: { dept: string; students: number; participations: number; wins: number }[];
  recentWinners: { title: string; outcome: string; achieved_on: string | null; student_name: string; department_code: string | null }[];
}

export interface ReportSummary {
  totalParticipants: number;
  winRate: number;
  topDomain: string | null;
  domainBreakdown: { domain: string; n: number }[];
}
