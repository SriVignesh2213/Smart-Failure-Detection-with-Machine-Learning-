import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiActivity,
  FiCpu,
  FiDatabase,
  FiTrendingUp,
  FiShield,
  FiCalendar,
  FiFileText,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiSun,
  FiMoon
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: FiActivity,
      roles: ['Admin', 'Engineer', 'Viewer']
    },
    {
      name: user?.role === 'Admin' ? 'Machines Management' : user?.role === 'Engineer' ? 'Assigned Machines' : 'Machine Status',
      path: '/machines',
      icon: FiCpu,
      roles: ['Admin', 'Engineer', 'Viewer']
    },
    {
      name: 'Sensor Telemetry',
      path: '/sensor-data',
      icon: FiDatabase,
      roles: ['Admin', 'Engineer', 'Viewer']
    },
    {
      name: 'AI Predictions',
      path: '/predictions',
      icon: FiTrendingUp,
      roles: ['Admin', 'Engineer', 'Viewer']
    },
    {
      name: 'Failure Black Box',
      path: '/blackbox',
      icon: FiShield,
      roles: ['Admin', 'Engineer', 'Viewer']
    },
    {
      name: 'Maintenance Logs',
      path: '/maintenance',
      icon: FiCalendar,
      roles: ['Admin', 'Engineer']
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: FiFileText,
      roles: ['Admin', 'Engineer', 'Viewer']
    },
    {
      name: 'My Profile',
      path: '/profile',
      icon: FiUser,
      roles: ['Admin', 'Engineer', 'Viewer']
    }
  ];

  const filteredNavItems = navItems.filter((item) => hasRole(item.roles));

  const roleBadgeStyles = {
    Admin: 'bg-red-500/10 text-red-500 border border-red-500/20',
    Engineer: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    Viewer: 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
  };

  const getPageTitle = (path) => {
    const currentItem = filteredNavItems.find(item => location.pathname.startsWith(item.path));
    if (currentItem) return currentItem.name;
    if (path.startsWith('/machines/')) return 'Machine Details';
    return 'Console Overview';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform">
              <FiCpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-xs tracking-wider leading-none bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">AI-Predictive-Maintenance</h1>
              <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-brand-600 dark:text-brand-400 block mt-1">Predictive Suite</span>
            </div>
          </Link>
        </div>

        {/* Role Identity Card in Sidebar */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 transition-all duration-300">
          <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 flex items-center justify-between transition-all duration-300">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">Active Role</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${roleBadgeStyles[user?.role] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {user?.role || 'Guest'}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto transition-all duration-300">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 transition-all duration-300">
          <div className="flex items-center gap-3 overflow-hidden transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 shrink-0 transition-all duration-300">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate leading-tight text-slate-900 dark:text-slate-200">{user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-300 cursor-pointer"
            title="Sign Out"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile / Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <aside
          className={`absolute top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-all duration-300 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
            <div className="flex items-center gap-3">
              <FiCpu className="w-6 h-6 text-brand-500" />
              <h1 className="font-bold text-xs tracking-wide text-slate-900 dark:text-slate-100">AI-Predictive-Maintenance</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-300">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto transition-all duration-300">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 transition-all duration-300">
            <div className="flex items-center gap-3 transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 transition-all duration-300">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">{user?.name}</p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${roleBadgeStyles[user?.role]}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-300">
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header/Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {getPageTitle(location.pathname)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-medium"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <FiSun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <FiMoon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Profile Dropdown indicator (Desktop only) */}
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{user?.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase mt-0.5 ${roleBadgeStyles[user?.role]}`}>
                  {user?.role}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-500 border border-slate-200 dark:border-slate-700">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content Frame */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
