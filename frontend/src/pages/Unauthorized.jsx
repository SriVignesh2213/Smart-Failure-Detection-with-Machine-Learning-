import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiShield, FiLock, FiArrowLeft, FiKey } from 'react-icons/fi';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans text-center">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
          <FiShield className="w-12 h-12" />
        </div>

        <div className="space-y-3">
          <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            HTTP 403 • Forbidden Access
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Access Restricted
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            You do not have the required role privileges to access this operational module or perform administrative actions on this resource.
          </p>
        </div>

        {/* User Role Claim Card */}
        {user && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <FiKey className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium block">Authenticated Subject</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{user.name} ({user.email})</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Assigned Role</span>
              <span className="font-black uppercase tracking-wider text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/20 hover:scale-[1.02] cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Safe Console
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
