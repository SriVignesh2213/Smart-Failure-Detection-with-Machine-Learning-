import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Key } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-panel p-8 rounded-2xl relative">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-500/30 flex items-center justify-center font-bold text-2xl text-cyan-400 uppercase shadow-lg shadow-cyan-500/10">
            {user?.full_name.charAt(0) || 'E'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{user?.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Corporate Email Address:</span>
            </div>
            <strong className="text-slate-200 font-mono">{user?.email}</strong>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">System User ID:</span>
            </div>
            <strong className="text-cyan-400 font-mono">{user?.id}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
