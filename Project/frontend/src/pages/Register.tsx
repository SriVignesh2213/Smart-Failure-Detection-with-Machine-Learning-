import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Cpu, Lock, Mail, User, AlertTriangle, ShieldCheck } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('engineer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getRegistrationErrorMessage = (err: any): string => {
    if (err?.response?.data) {
      const { detail } = err.response.data;

      if (typeof detail === 'string') {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail.map((item: any) => item?.msg || 'Invalid value').join(', ');
      }

      if (typeof err.response.data?.message === 'string') {
        return err.response.data.message;
      }
    }

    if (err?.message === 'Network Error') {
      return 'Backend service is unavailable. Start the API and MongoDB services first.';
    }

    return 'Registration rejected. Check validation values.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);

    try {
      // 1. Register account
      await api.post('/auth/register', {
        email,
        full_name: fullName,
        password,
        role
      });
      
      // 2. Automatically authenticate
      const loginRes = await api.post('/auth/login', {
        email,
        password
      });

      setSuccess(true);
      setTimeout(() => {
        login(loginRes.data.access_token);
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(getRegistrationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-industrial-950 relative overflow-hidden px-4">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animated-glow"></div>

      <div className="w-full max-w-md z-10 my-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-3">
            <Cpu className="w-7 h-7 text-cyan-400" />
          </div>
          <p className="text-[10px] text-slate-400 tracking-widest mt-1">Smart Failure Detection System</p>
        </div>

        {/* Register Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          
          <h3 className="text-lg font-semibold text-slate-200 mb-5">System Registration</h3>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Registration approved! Redirecting to credentials console...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Corporate Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="engineer@factory.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Factory Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
              >
                <option value="engineer">Plant Maintenance Engineer</option>
                <option value="admin">System Operations Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Secure Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 mt-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm rounded-lg uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Request Account'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-400">
              Already verified?{' '}
              <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
