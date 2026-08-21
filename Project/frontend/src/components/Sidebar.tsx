import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  History, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Machine Assets', path: '/machines', icon: Cpu },
    { name: 'Run Predict ML', path: '/predict', icon: Activity },
    { name: 'Prediction History', path: '/history', icon: History },
    { name: 'Exports & Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Threshold Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-industrial-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30">
            <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest">Predictive Maintenance</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 border-b border-slate-800/60 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 border border-slate-700 uppercase">
              {user?.full_name.charAt(0) || 'E'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/10 border-l-4 border-cyan-400 text-cyan-400 font-semibold shadow-[inset_0_0_8px_rgba(6,182,212,0.05)]'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
