import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiCpu, FiArrowLeft } from 'react-icons/fi';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await forgotPassword(data.email);
    setSubmitting(false);

    if (result.success) {
      toast.success('Password reset link sent to your email!');
      setSubmitted(true);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-500/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-500/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 z-10">
        <div className="flex flex-col items-center mb-6">
          <FiCpu className="w-10 h-10 text-brand-500 animate-pulse mb-3" />
          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">AI-Predictive-Maintenance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-widest">Trouble Logging In?</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm font-semibold">
              Check your inbox for a password reset link.
            </div>
            <p className="text-xs text-slate-400">
              We've dispatched reset instructions to your registered email address.
            </p>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-brand-500 hover:text-brand-400">
              <FiArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed text-center">
              Provide your email address below, and we will send you a secure link to reset your account credentials.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  placeholder="developer@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all ${
                    errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {errors.email && <span className="text-xs text-red-500 font-semibold">{errors.email.message}</span>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-brand-600/10 cursor-pointer"
            >
              {submitting ? 'Sending Request...' : 'Send Reset Instructions'}
            </button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
              <FiArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
