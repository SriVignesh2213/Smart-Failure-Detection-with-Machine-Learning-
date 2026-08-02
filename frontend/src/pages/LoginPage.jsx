import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { FiMail, FiLock, FiCpu, FiEye, FiEyeOff } from "react-icons/fi";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const from = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await login(data.email, data.password);
    setSubmitting(false);

    if (result.success) {
      toast.success("Logged in successfully!");
      navigate(from, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans relative">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-500/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <FiCpu className="w-10 h-10 text-brand-500 animate-pulse mb-3" />
          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            AI-Predictive-Maintenance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-widest">
            Sign In to Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="email"
                placeholder="developer@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-500 font-semibold">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-brand-500 hover:text-brand-400"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <FiEyeOff className="w-4 h-4" />
                ) : (
                  <FiEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-red-500 font-semibold">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-brand-600/10 cursor-pointer"
          >
            {submitting ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          New to Maintain.AI?{" "}
          <Link
            to="/register"
            className="font-bold text-brand-500 hover:text-brand-400"
          >
            Create an Account
          </Link>
        </div> */}
        <div className="mt-6 flex flex-col items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            New to AI-Predictive-Maintenance?{" "}
            <Link
              to="/register"
              className="font-bold text-brand-500 hover:text-brand-400"
            >
              Create an Account
            </Link>
          </p>

          <div className="w-full my-5 border-t border-slate-200 dark:border-slate-700"></div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Want to explore the platform first?
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2
               w-full
               py-3
               rounded-lg
               border
               border-slate-300
               dark:border-slate-700
               bg-white
               dark:bg-slate-800
               text-slate-700
               dark:text-slate-200
               hover:bg-slate-100
               dark:hover:bg-slate-700
               font-semibold
               transition-all
               duration-300
               cursor-pointer"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
