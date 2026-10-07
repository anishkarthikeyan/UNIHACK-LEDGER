import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  Bell,
  FileText,
  Settings,
  Search,
  Menu,
  X,
  UserCircle,
  Compass,
  GitMerge,
  Award,
  LogOut,
  PlusCircle,
  Sparkles,
  Loader2,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ROLE_LABEL } from '../types';
import type { Hackathon, Role } from '../types';
import type { NavigateFn } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: NavigateFn;
  role: Role;
  onLogout: () => void;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

// The two competition-management roles use slightly different tab ids for the hackathon
// detail screen (a pre-existing naming quirk in App.tsx's router) — resolve it once here
// rather than duplicating the branch everywhere a search result is opened.
function hackathonDetailTab(role: Role) {
  return role === 'student' ? 'hackathon-detail' : 'hackathons-detail';
}

// Coordinator, SDE Coordinator and HOD only monitor their cohort in this phase — no hackathon
// management screens, so the hackathon search (which opens one) is hidden for them.
function isCohortRole(role: Role) {
  return role === 'coordinator' || role === 'sde_coordinator' || role === 'hod';
}

export default function Layout({ children, activeTab, setActiveTab, role, onLogout }: LayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Hackathon[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const displayName = user?.full_name ?? 'Guest';
  const initials = (initialsOf(displayName) || 'U').toUpperCase();

  // Poll unread notifications so the bell badge reflects reality instead of always being lit.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.notifications.list()
        .then((rows) => { if (!cancelled) setUnreadCount(rows.filter((n) => !n.read_at).length); })
        .catch(() => { /* non-critical for the badge */ });
    };
    load();
    const interval = setInterval(load, 45000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeTab === 'notifications']);

  // Debounced live search across hackathons (the one entity every role can see and act on).
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    const handle = setTimeout(() => {
      api.hackathons.list(query)
        .then((rows) => setSearchResults(rows.slice(0, 8)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const openSearchResult = (h: Hackathon) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSearchOpen(false);
    setActiveTab(hackathonDetailTab(role), h.id);
  };

  const getNavItems = () => {
    if (role === 'student') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Explore Hackathons', icon: Compass, id: 'explore' },
        { name: 'My Pipeline', icon: GitMerge, id: 'pipeline' },
        { name: 'My Teams', icon: Users, id: 'teams' },
        { name: 'Calendar', icon: Calendar, id: 'calendar' },
        { name: 'Notifications', icon: Bell, id: 'notifications' },
        { name: 'Projects', icon: Briefcase, id: 'projects' },
        { name: 'Achievements', icon: Award, id: 'achievements' },
        { name: 'Showcase', icon: Sparkles, id: 'showcase' },
        { name: 'Suggest Hackathon', icon: PlusCircle, id: 'suggest' },
        { name: 'Profile', icon: UserCircle, id: 'profile' },
      ];
    }
    if (role === 'faculty') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Hackathons', icon: Trophy, id: 'hackathons' },
        { name: 'My Sections', icon: Layers, id: 'cohort' },
        { name: 'Participants', icon: Users, id: 'participants' },
        { name: 'Teams', icon: Users, id: 'teams' },
        { name: 'Projects', icon: Briefcase, id: 'projects' },
        { name: 'Review & Verify', icon: CheckSquare, id: 'review' },
        { name: 'Calendar', icon: Calendar, id: 'calendar' },
        { name: 'Notifications', icon: Bell, id: 'notifications' },
        { name: 'Reports', icon: FileText, id: 'reports' },
        { name: 'Settings', icon: Settings, id: 'settings' },
      ];
    }
    if (isCohortRole(role)) {
      return [
        { name: 'Cohort Overview', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Teams', icon: Users, id: 'teams' },
        { name: 'Notifications', icon: Bell, id: 'notifications' },
        { name: 'Settings', icon: Settings, id: 'settings' },
      ];
    }
    return [
      { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
      { name: 'Competitions', icon: Trophy, id: 'hackathons' },
      { name: 'User Management', icon: Users, id: 'users' },
      { name: 'Scope Assignments', icon: Layers, id: 'scopes' },
      { name: 'Audit Logs', icon: FileText, id: 'audit' },
      { name: 'System Settings', icon: Settings, id: 'settings' },
      { name: 'Profile', icon: UserCircle, id: 'profile' },
    ];
  };

  const navItems = getNavItems() || [];

  // Bottom mobile navigation key items
  const getBottomNavItems = () => {
    if (role === 'student') {
      return [
        { name: 'Home', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Explore', icon: Compass, id: 'explore' },
        { name: 'Pipeline', icon: GitMerge, id: 'pipeline' },
        { name: 'Teams', icon: Users, id: 'teams' },
        { name: 'More', icon: Menu, id: 'drawer_trigger' },
      ];
    }
    if (role === 'faculty') {
      return [
        { name: 'Home', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Events', icon: Trophy, id: 'hackathons' },
        { name: 'Review', icon: CheckSquare, id: 'review' },
        { name: 'Teams', icon: Users, id: 'teams' },
        { name: 'More', icon: Menu, id: 'drawer_trigger' },
      ];
    }
    if (isCohortRole(role)) {
      return [
        { name: 'Cohort', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Teams', icon: Users, id: 'teams' },
        { name: 'Alerts', icon: Bell, id: 'notifications' },
        // Opens the drawer, which holds Settings and Logout (the only mobile logout entry point).
        { name: 'More', icon: Menu, id: 'drawer_trigger' },
      ];
    }
    return [
      { name: 'Home', icon: LayoutDashboard, id: 'dashboard' },
      { name: 'Users', icon: Users, id: 'users' },
      { name: 'Audit', icon: FileText, id: 'audit' },
      { name: 'Settings', icon: Settings, id: 'settings' },
      { name: 'More', icon: Menu, id: 'drawer_trigger' },
    ];
  };

  const bottomNavItems = getBottomNavItems();

  const handleNavClick = (id: string) => {
    if (id === 'drawer_trigger') {
      setMobileDrawerOpen(true);
    } else {
      setActiveTab(id);
      setMobileDrawerOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 font-sans text-white overflow-hidden select-none">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)} 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-neutral-900 z-50 flex flex-col border-r border-neutral-800 transition-transform duration-300 ease-in-out md:hidden ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        } pt-safe pb-safe pl-safe`}
      >
        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black">
              U
            </div>
            <span className="font-black text-lg tracking-tighter uppercase text-white">
              UniHack<span className="text-yellow-400">Ledger</span>
            </span>
          </div>
          <button 
            onClick={() => setMobileDrawerOpen(false)}
            className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card in Mobile Drawer */}
        <div className="p-4 mx-3 my-3 bg-neutral-800/60 rounded-2xl border border-neutral-700/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 text-black font-black rounded-full flex items-center justify-center text-sm shadow-md shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="font-black uppercase tracking-wider text-xs text-white truncate">
              {displayName}
            </p>
            <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> {ROLE_LABEL[role]} Account
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-2xl transition-all uppercase tracking-wider text-xs font-bold ${
                  isActive 
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 font-black' 
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-black' : 'text-neutral-500'} />
                <span className="ml-3.5">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Drawer Footer */}
        <div className="p-4 border-t border-neutral-800 space-y-2">
          <button 
            onClick={onLogout} 
            className="flex items-center text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 w-full py-3 px-4 rounded-xl bg-red-950/30 border border-red-900/40"
          >
            <LogOut size={18} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (visible on md+) */}
      <aside 
        className={`hidden md:flex ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-neutral-900 border-r border-neutral-800 transition-all duration-300 flex-col h-full z-20 shrink-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-neutral-800 h-16 shrink-0">
          {sidebarOpen && (
            <span className="font-black text-xl tracking-tighter uppercase text-white">
              UniHack<span className="text-yellow-400">Ledger</span>
            </span>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3.5 py-3 rounded-2xl transition-all uppercase tracking-widest text-xs font-bold ${
                  isActive 
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 font-black' 
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-black' : 'text-neutral-500'} />
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-neutral-800">
          <button 
            onClick={onLogout} 
            className="flex items-center text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-red-400 w-full py-2.5 px-2 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative pl-safe pr-safe">
        {/* Top App Header — taller and roomier on mobile only (h-20, vs. the unchanged h-16 desktop
            height at md:); the hamburger drawer toggle that used to live here is gone (see Layout
            navigation refinement) — the bottom nav's MORE tab is now the single entry point for
            secondary navigation, opening this exact same mobileDrawerOpen drawer. */}
        <header className="h-20 md:h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 shrink-0 pt-safe z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xl">
            {/* Mobile Title Logo */}
            <div className="md:hidden flex items-center gap-1.5 shrink-0">
              <span className="font-black text-xl uppercase tracking-tighter text-white whitespace-nowrap">
                UniHack<span className="text-yellow-400">.</span>
              </span>
            </div>

            {/* Search Input (Desktop & Tablet) */}
            <div className="relative w-full max-w-md hidden sm:block" style={isCohortRole(role) ? { display: 'none' } : undefined}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="Search hackathons..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-full focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs outline-none transition-all text-white placeholder-neutral-500"
              />
              {showResults && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border-2 border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 flex items-center justify-center text-neutral-500"><Loader2 size={16} className="animate-spin" /></div>
                  ) : searchResults.length === 0 ? (
                    <p className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">No hackathons match "{searchQuery}"</p>
                  ) : (
                    searchResults.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => openSearchResult(h)}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-0"
                      >
                        <p className="text-xs font-bold text-white truncate">{h.title}</p>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mt-0.5">{h.organizer}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full sm:hidden"
              style={isCohortRole(role) ? { display: 'none' } : undefined}
            >
              <Search size={22} />
            </button>

            {/* Notifications Button — this single element is shared by mobile and desktop (there
                is no separate desktop bell), so the size bump is applied responsively: larger by
                default (mobile), reverting to the original 20px at md: so the desktop header is
                visually unchanged. */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full relative transition-colors"
            >
              <Bell className="w-[22px] h-[22px] md:w-5 md:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-400 rounded-full ring-2 ring-neutral-900"></span>
              )}
            </button>

            {/* User Profile — same reasoning as the bell: one shared avatar button, sized up on
                mobile only, back to its original 36px at md: for an unchanged desktop header. */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-4 border-l border-neutral-800">
              <button
                onClick={() => setActiveTab('profile')}
                className="w-10 h-10 md:w-9 md:h-9 bg-yellow-400 text-black font-black rounded-full flex items-center justify-center text-sm md:text-xs shadow-md ring-2 ring-yellow-400/30 hover:scale-105 transition-transform shrink-0"
              >
                {initials}
              </button>
              <div className="hidden lg:block text-left">
                <p className="font-black uppercase tracking-wider text-xs text-white leading-tight">
                  {displayName}
                </p>
                <p className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest">
                  {ROLE_LABEL[role]} portal
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search Overlay Bar */}
        {searchOpen && (
          <div className="sm:hidden p-3 bg-neutral-900 border-b border-neutral-800 animate-in slide-in-from-top-2 duration-200">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hackathons..."
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-yellow-400/50 rounded-xl text-xs outline-none text-white placeholder-neutral-500"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <X size={16} />
              </button>
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 bg-neutral-950 border-2 border-neutral-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 flex items-center justify-center text-neutral-500"><Loader2 size={16} className="animate-spin" /></div>
                ) : searchResults.length === 0 ? (
                  <p className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">No hackathons match "{searchQuery}"</p>
                ) : (
                  searchResults.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => openSearchResult(h)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-0"
                    >
                      <p className="text-xs font-bold text-white truncate">{h.title}</p>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mt-0.5">{h.organizer}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Page Content Viewport — the app's one legitimate scroll region. overflow-x-hidden
            here (not just on html/body) is the actual containment boundary: it clips a
            misbehaving descendant instead of letting it widen this container and create
            page-level horizontal scroll. */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-neutral-950 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {children}
          </div>
        </div>

        {/* Bottom Mobile Navigation Bar (for Mobile Android experience) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 px-2 py-1.5 pb-safe pl-safe pr-safe">
          <div className="flex justify-around items-center min-w-0">
            {bottomNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'text-yellow-400 scale-105 font-bold' 
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-yellow-400' : 'text-neutral-500'} />
                  <span className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${isActive ? 'text-yellow-400' : 'text-neutral-500'}`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

