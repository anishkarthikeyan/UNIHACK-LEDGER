import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManageHackathons from './pages/ManageHackathons';
import AddHackathon from './pages/AddHackathon';
import HackathonDetail from './pages/HackathonDetail';
import HackathonEditForm from './pages/HackathonEditForm';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import ExploreHackathons from './pages/ExploreHackathons';
import StudentPipeline from './pages/StudentPipeline';

import StudentTeams from './pages/StudentTeams';

import StudentCalendar from './pages/StudentCalendar';
import StudentProjects from './pages/StudentProjects';
import StudentProjectForm from './pages/StudentProjectForm';
import StudentNotifications from './pages/StudentNotifications';
import StudentProjectDetail from './pages/StudentProjectDetail';
import StudentHackathonDetail from './pages/StudentHackathonDetail';
import StudentRegistration from './pages/StudentRegistration';
import StudentTeamForm from './pages/StudentTeamForm';
import StudentShowcase from './pages/StudentShowcase';
import StudentAchievements from './pages/StudentAchievements';
import StudentProfileSettings from './pages/StudentProfileSettings';

import StudentSuggestHackathon from './pages/StudentSuggestHackathon';
import FacultyReviewVerify from './pages/FacultyReviewVerify';
import FacultyParticipants from './pages/FacultyParticipants';
import FacultyTeams from './pages/FacultyTeams';
import FacultyProjects from './pages/FacultyProjects';
import FacultyCalendar from './pages/FacultyCalendar';
import FacultyNotifications from './pages/FacultyNotifications';
import FacultyReports from './pages/FacultyReports';
import FacultySettings from './pages/FacultySettings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminSystemSettings from './pages/AdminSystemSettings';
import AdminProfileSettings from './pages/AdminProfileSettings';
import AdminScopeAssignments from './pages/AdminScopeAssignments';
import CohortDashboard from './pages/CohortDashboard';
import { useAuth } from './context/AuthContext';

export type NavigateFn = (route: string, id?: string) => void;

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  // Read once at mount — a password-reset link is a one-time entry point into the app, not a
  // persistent client-side route, so there's no need to keep re-parsing location.search on every
  // render. Cleared from the URL once the reset flow finishes (see the ResetPassword branch below).
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset_token'));
  const [resetTokenConsumed, setResetTokenConsumed] = useState(false);

  const onNavigate: NavigateFn = (route, id) => {
    setActiveTab(route);
    setSelectedId(id);
  };

  // Checked ahead of the loading/auth gate below: a reset link must work whether or not the
  // visitor happens to have a session in this browser (e.g. a shared/kiosk machine, or simply
  // signed out), and it must not silently dead-end into the normal dashboard for someone who is
  // signed in.
  if (resetToken && !resetTokenConsumed) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          setResetTokenConsumed(true);
          window.history.replaceState(null, '', window.location.pathname);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500 text-xs font-bold uppercase tracking-widest">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const role = user.role;

  const renderContent = () => {
    if (role === 'student') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard onNavigate={onNavigate} />;
        case 'explore':
          return <ExploreHackathons onNavigate={onNavigate} />;
        case 'pipeline':
          return <StudentPipeline onNavigate={onNavigate} />;
        case 'teams':
          return <StudentTeams onNavigate={onNavigate} />;
        case 'team-form':
          return <StudentTeamForm onNavigate={onNavigate} />;
        case 'calendar':
          return <StudentCalendar />;
        case 'notifications':
          return <StudentNotifications onNavigate={onNavigate} />;
        case 'projects':
          return <StudentProjects onNavigate={onNavigate} />;
        case 'project-add':
          return <StudentProjectForm onNavigate={onNavigate} />;
        case 'project-detail':
          return <StudentProjectDetail onNavigate={onNavigate} projectId={selectedId} />;
        case 'hackathon-detail':
          return <StudentHackathonDetail onNavigate={onNavigate} hackathonId={selectedId} />;
        case 'hackathon-register':
          return <StudentRegistration onNavigate={onNavigate} hackathonId={selectedId} />;
        case 'showcase':
          return <StudentShowcase onNavigate={onNavigate} />;
        case 'achievements':
          return <StudentAchievements />;
        case 'suggest':
          return <StudentSuggestHackathon onNavigate={onNavigate} />;
        case 'profile':
          return <StudentProfileSettings />;
        default:
          return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 pt-20">
              <div className="text-4xl mb-4 grayscale">🚧</div>
              <p className="text-lg font-black uppercase tracking-widest text-white">Student Module Under Construction</p>
              <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Select 'Dashboard' or 'Explore'</p>
            </div>
          );
      }
    }

    if (role === 'faculty') {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard onNavigate={onNavigate} />;
        case 'hackathons':
          return (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => onNavigate('hackathons-add')}
                  className="px-6 py-3 bg-yellow-400 text-white font-bold uppercase tracking-widest text-[10px] rounded-full hover:scale-95 transition-transform shadow-lg"
                >
                  + Add Hackathon
                </button>
              </div>
              <ManageHackathons onNavigate={onNavigate} />
            </div>
          );
        case 'hackathons-add':
            return (
              <div className="space-y-4">
                <button
                  onClick={() => onNavigate('hackathons')}
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-2 transition-colors"
                >
                  &larr; Back to Manage
                </button>
                <AddHackathon onNavigate={onNavigate} />
              </div>
            );

        case 'cohort':
          return <CohortDashboard />;
        case 'participants':
          return <FacultyParticipants />;
        case 'teams':
          return <FacultyTeams />;
        case 'projects':
          return <FacultyProjects />;
        case 'review':
          return <FacultyReviewVerify />;
        case 'calendar':
          return <FacultyCalendar />;
        case 'notifications':
          return <FacultyNotifications />;
        case 'reports':
          return <FacultyReports />;
        case 'settings':
          return <FacultySettings />;

        case 'hackathons-detail':
            return (
              <div className="space-y-4">
                <button
                  onClick={() => onNavigate('hackathons')}
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-2 transition-colors"
                >
                  &larr; Back to Manage
                </button>
                <HackathonDetail hackathonId={selectedId} onNavigate={onNavigate} />
              </div>
            );
        case 'hackathons-edit':
            return <HackathonEditForm hackathonId={selectedId} onNavigate={onNavigate} />;
        default:
          return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 pt-20">
              <div className="text-4xl mb-4 grayscale">🚧</div>
              <p className="text-lg font-black uppercase tracking-widest text-white">Faculty Module Under Construction</p>
              <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Select 'Dashboard' or 'Hackathons'</p>
            </div>
          );
      }
    }

    // Coordinator, SDE Coordinator, HOD: read-only cohort monitoring. What they see is decided
    // server-side by their scope assignments; these tabs only choose which view to render.
    if (role === 'coordinator' || role === 'sde_coordinator' || role === 'hod') {
      switch (activeTab) {
        case 'teams':
          return <FacultyTeams />;
        case 'notifications':
          return <FacultyNotifications />;
        case 'settings':
          return <FacultySettings />;
        default:
          return <CohortDashboard />;
      }
    }

    if (role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={onNavigate} />;
        case 'users':
          return <AdminUserManagement />;
        case 'audit':
          return <AdminAuditLogs />;
        case 'scopes':
          return <AdminScopeAssignments />;
        case 'settings':
          return <AdminSystemSettings />;
        case 'profile':
          return <AdminProfileSettings />;
        case 'hackathons':
          return (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => onNavigate('hackathons-add')}
                  className="px-6 py-3 bg-yellow-400 text-white font-bold uppercase tracking-widest text-[10px] rounded-full hover:scale-95 transition-transform shadow-lg"
                >
                  + Add Hackathon
                </button>
              </div>
              <ManageHackathons onNavigate={onNavigate} />
            </div>
          );
        case 'hackathons-add':
            return (
              <div className="space-y-4">
                <button
                  onClick={() => onNavigate('hackathons')}
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-2 transition-colors"
                >
                  &larr; Back to Manage
                </button>
                <AddHackathon onNavigate={onNavigate} />
              </div>
            );
        case 'hackathons-detail':
            return (
              <div className="space-y-4">
                <button
                  onClick={() => onNavigate('hackathons')}
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-yellow-400 mb-4 flex items-center gap-2 transition-colors"
                >
                  &larr; Back to Manage
                </button>
                <HackathonDetail hackathonId={selectedId} onNavigate={onNavigate} />
              </div>
            );
        case 'hackathons-edit':
            return <HackathonEditForm hackathonId={selectedId} onNavigate={onNavigate} />;
        default:
          return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 pt-20">
              <div className="text-4xl mb-4 grayscale">🛡️</div>
              <p className="text-lg font-black uppercase tracking-widest text-white">Admin Portal</p>
              <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Select 'Dashboard' or 'Competitions'</p>
            </div>
          );
      }
    }
  };

  return (
    <Layout role={role} activeTab={activeTab.startsWith('hackathons') ? 'hackathons' : activeTab} setActiveTab={onNavigate} onLogout={logout}>
      {renderContent()}
    </Layout>
  );
}
