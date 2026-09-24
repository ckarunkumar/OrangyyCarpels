import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Clock, Users, Building2, BarChart3, CalendarCheck, Settings, Layers, LogOut, ChevronDown, Bell, FileText, SlidersHorizontal } from 'lucide-react';
import UserProfileDrawer from './UserProfileDrawer';
import NotificationDrawer, { NotificationItem } from './NotificationDrawer';
import GlobalSearchBar from './GlobalSearchBar';

export type UserRole = 'Super Admin' | 'Project Manager' | 'Employee' | 'Client';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => { fetch('/api/notifications').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setNotifications(d); }).catch(() => {}); };
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleMarkAsRead = (id: number) => {
    fetch(`/api/notifications/${id}/read`, { method: 'POST' }).then(fetchNotifications);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };
  const handleMarkAllAsRead = () => {
    fetch('/api/notifications/read-all', { method: 'POST' }).then(fetchNotifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };
  const handleSelectNotification = (item: NotificationItem) => {
    if (!item.isRead) handleMarkAsRead(item.id);
    setIsNotificationOpen(false);
    if (item.projectId) navigate(`/timesheets?projectId=${item.projectId}`);
  };
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Super Admin', 'Project Manager', 'Employee', 'Client'] },
    { label: 'Timesheets', path: '/timesheets', icon: Clock, roles: ['Super Admin', 'Project Manager', 'Employee'] },
    { label: 'Team', path: '/employees', icon: Users, roles: ['Super Admin', 'Project Manager'] },
    { label: 'Clientele', path: '/clients', icon: Building2, roles: ['Super Admin', 'Project Manager'] },
    { label: 'Leaves', path: '/leaves', icon: CalendarCheck, roles: ['Super Admin', 'Project Manager', 'Employee'] },
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['Super Admin', 'Project Manager'] },
  ];

  if (!user || !role) return null;
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-studio-bg flex flex-col font-sans">
      <UserProfileDrawer open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <NotificationDrawer open={isNotificationOpen} notifications={notifications} onClose={() => setIsNotificationOpen(false)} onSelectNotification={handleSelectNotification} onMarkAllAsRead={handleMarkAllAsRead} />

      {/* Top Header */}
      <header className="shrink-0 border-b border-studio-border bg-white pr-6 flex justify-between items-center h-14 z-40">
        <div className="flex items-center h-full">
          <button
            type="button"
            onClick={() => setIsSidebarVisible((prev) => !prev)}
            className="w-16 h-full flex items-center justify-center shrink-0 border-r border-studio-border hover:bg-studio-sidebar/60 transition-colors focus:outline-none cursor-pointer"
            title={isSidebarVisible ? 'Hide navigation bar' : 'Open navigation bar'}
          >
            <img src="/logo.svg" alt="Orangyy Carpels" className="w-7 h-7 object-contain hover:scale-105 transition-transform" />
          </button>
          <Link to="/" className="font-semibold text-[14px] tracking-tight text-studio-text pl-4 hover:text-brand-orange transition-colors shrink-0">
            Orangyy Carpels
          </Link>
          <GlobalSearchBar />
        </div>

        {/* Right Top Header Actions */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIsNotificationOpen(true)} title="Notifications" className="relative p-2 rounded-lg border border-studio-border bg-studio-sidebar/40 hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (<span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-brand-orange text-[9.5px] font-bold text-white shadow-xs">{unreadCount}</span>)}
          </button>

          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setMenuOpen((p) => !p)} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-studio-border bg-studio-sidebar/40 hover:bg-studio-hover/70 hover:border-brand-orange/40 transition-all focus:outline-none shadow-sm cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[12px] font-bold text-studio-muted border border-studio-border overflow-hidden shrink-0">
                {user.avatar ? <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" /> : user.fullName[0]}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[12px] font-bold text-studio-text leading-tight">{user.fullName}</p>
                <p className="text-[9.5px] text-studio-muted leading-tight">{user.designation || 'Team Member'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-studio-muted shrink-0" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-studio-border rounded-lg shadow-xl py-1 z-50 w-44 text-[12px] animate-in fade-in slide-in-from-top-1">
                <button type="button" onClick={() => { setMenuOpen(false); setIsProfileOpen(true); }} className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-studio-text hover:bg-studio-hover hover:text-brand-orange transition-colors cursor-pointer"><Settings className="w-3.5 h-3.5 text-studio-muted" /> User Settings</button>
                <button type="button" onClick={() => { setMenuOpen(false); logout(); }} className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors border-t border-studio-border/60 cursor-pointer"><LogOut className="w-3.5 h-3.5 text-red-500" /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Side Icon-Only Navigation Bar with Show/Hide Toggle */}
        <aside
          className={`h-full border-studio-border bg-studio-sidebar py-3 flex flex-col justify-between shrink-0 overflow-visible items-center z-30 transition-all duration-200 ease-in-out ${
            isSidebarVisible ? 'w-16 border-r px-2 opacity-100' : 'w-0 border-r-0 px-0 opacity-0 pointer-events-none overflow-hidden'
          }`}
        >
          {/* Main Module Icons */}
          <nav className="space-y-2 w-full flex flex-col items-center">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;
              return (
                <div key={item.label} className="relative group flex justify-center w-full">
                  <Link
                    to={item.path}
                    title={item.label}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                      isActive ? 'bg-orange-50 text-brand-orange font-semibold shadow-xs border border-orange-200' : 'text-studio-muted hover:bg-studio-hover hover:text-studio-text'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-orange' : 'text-studio-muted group-hover:text-studio-text'}`} />
                  </Link>
                  {/* Tooltip on mouse hover */}
                  <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11.5px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-[100] pointer-events-none">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-4 border-transparent border-r-slate-900" />
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom General Settings Icon for Super Admin */}
          {role === 'Super Admin' && (
            <div className="w-full pt-2 border-t border-studio-border/60 flex flex-col items-center shrink-0">
              <div className="relative group flex justify-center w-full">
                <Link
                  to="/settings/studio"
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                    location.pathname.startsWith('/settings')
                      ? 'bg-orange-50 text-brand-orange font-semibold shadow-xs border border-orange-200'
                      : 'text-studio-muted hover:bg-studio-hover hover:text-studio-text'
                  }`}
                >
                  <Settings className={`w-4 h-4 shrink-0 ${location.pathname.startsWith('/settings') ? 'text-brand-orange' : 'text-studio-muted group-hover:text-studio-text'}`} />
                </Link>

                {/* Hover Flyout Sub Menu */}
                <div className="absolute left-full bottom-0 ml-2 py-2 px-1.5 bg-white border border-studio-border rounded-xl shadow-2xl min-w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-150 z-[100]">
                  <div className="px-2.5 pb-1.5 mb-1 border-b border-studio-border/60">
                    <span className="text-[11px] font-bold text-studio-text tracking-tight uppercase">General Settings</span>
                  </div>
                  <div className="space-y-0.5">
                    <Link to="/settings/studio" className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${location.pathname === '/settings' || location.pathname === '/settings/studio' ? 'bg-orange-50 text-brand-orange font-semibold' : 'text-studio-text hover:bg-studio-hover'}`}><Building2 className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span>Studio</span></Link>
                    <Link to="/settings/configurations" className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${location.pathname === '/settings/configurations' || location.pathname === '/settings/config' ? 'bg-orange-50 text-brand-orange font-semibold' : 'text-studio-text hover:bg-studio-hover'}`}><SlidersHorizontal className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span>Configurations</span></Link>
                    <Link to="/settings/services" className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${location.pathname === '/settings/services' || location.pathname === '/settings/bl-sl' ? 'bg-orange-50 text-brand-orange font-semibold' : 'text-studio-text hover:bg-studio-hover'}`}><Layers className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span>Services</span></Link>
                    <Link to="/settings/leaves" className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${location.pathname === '/settings/leaves' ? 'bg-orange-50 text-brand-orange font-semibold' : 'text-studio-text hover:bg-studio-hover'}`}><CalendarCheck className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span>Leaves</span></Link>
                    <Link to="/settings/logs" className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${location.pathname === '/settings/logs' ? 'bg-orange-50 text-brand-orange font-semibold' : 'text-studio-text hover:bg-studio-hover'}`}><FileText className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span>Logs</span></Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 min-h-0 bg-studio-bg overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
