import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Cpu, Lock, Mail, AlertTriangle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const getLoginErrorMessage = (err: any): string => {
    if (err?.response?.data) {
      const { detail } = err.response.data;

      if (typeof detail === 'string') {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail.map((item: any) => item?.msg || 'Invalid value').join(', ');
      }

      if (typeof detail?.msg === 'string') {
        return detail.msg;
      }

      if (typeof err.response.data?.message === 'string') {
        return err.response.data.message;
      }
    }

    if (err?.message === 'Network Error') {
      return 'System connection failure. Check server status.';
    }

    return 'System connection failure. Check server status.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.access_token);
    } catch (err: any) {
      console.error(err);
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-industrial-950 relative overflow-hidden px-4">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animated-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-cyan-500/10 p-3.5 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-4">
            <Cpu className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-xs text-slate-400 tracking-widest mt-1">Smart Failure Detection System</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          
          <h3 className="text-lg font-semibold text-slate-200 mb-6">Access Control</h3>
          
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Corporate Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="engineer@factory.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Secure Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm rounded-lg uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Authenticate'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              New system user?{' '}
              <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
                Request Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
