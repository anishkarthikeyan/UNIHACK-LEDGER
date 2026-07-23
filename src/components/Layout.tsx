import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'student' | 'faculty' | 'admin';
  onLogout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, role, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
        { name: 'Suggest Hackathon', icon: PlusCircle, id: 'suggest' },
        { name: 'Profile', icon: UserCircle, id: 'profile' },
      ];
    }
    if (role === 'faculty') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Hackathons', icon: Trophy, id: 'hackathons' },
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
    return [
      { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
      { name: 'User Management', icon: Users, id: 'users' },
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
        } pt-safe pb-safe`}
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
            {role === 'student' ? 'AK' : role === 'faculty' ? 'DR' : 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="font-black uppercase tracking-wider text-xs text-white truncate">
              {role === 'student' ? 'Anish K.' : role === 'faculty' ? 'Dr. Meena R.' : 'System Admin'}
            </p>
            <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> {role} Account
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
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top App Header */}
        <header className="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 shrink-0 pt-safe z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xl">
            {/* Mobile Drawer Toggle */}
            <button 
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 text-neutral-300 hover:text-white bg-neutral-800 rounded-xl md:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Title Logo */}
            <div className="md:hidden flex items-center gap-1.5 shrink-0">
              <span className="font-black text-sm uppercase tracking-tighter text-white">
                UniHack<span className="text-yellow-400">.</span>
              </span>
            </div>

            {/* Search Input (Desktop & Tablet) */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input 
                type="text" 
                placeholder="Search hackathons, teams, projects..." 
                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-full focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs outline-none transition-all text-white placeholder-neutral-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2.5 sm:space-x-4 shrink-0">
            {/* Mobile Search Button */}
            <button 
              onClick={() => setSearchOpen(!searchOpen)} 
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full sm:hidden"
            >
              <Search size={20} />
            </button>

            {/* Notifications Button */}
            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full relative transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-400 rounded-full ring-2 ring-neutral-900"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-4 border-l border-neutral-800">
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-9 h-9 bg-yellow-400 text-black font-black rounded-full flex items-center justify-center text-xs shadow-md ring-2 ring-yellow-400/30 hover:scale-105 transition-transform"
              >
                {role === 'student' ? 'AK' : role === 'faculty' ? 'DR' : 'AD'}
              </button>
              <div className="hidden lg:block text-left">
                <p className="font-black uppercase tracking-wider text-xs text-white leading-tight">
                  {role === 'student' ? 'Anish K.' : role === 'faculty' ? 'Dr. Meena R.' : 'System Admin'}
                </p>
                <p className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest">
                  {role} portal
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
                placeholder="Search..." 
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-yellow-400/50 rounded-xl text-xs outline-none text-white placeholder-neutral-500"
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-950 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Bottom Mobile Navigation Bar (for Mobile Android experience) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 px-2 py-1.5 pb-safe">
          <div className="flex justify-around items-center">
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

