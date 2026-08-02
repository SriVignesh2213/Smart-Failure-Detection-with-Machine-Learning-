import React from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans text-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-full">
            <FiAlertTriangle className="w-12 h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">404 - Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The requested console interface or resource route is not available on this server node.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all hover:scale-102"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
