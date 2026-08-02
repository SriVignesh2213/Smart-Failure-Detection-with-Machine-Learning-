import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiPhone, FiLock, FiMail, FiShield, FiKey } from 'react-icons/fi';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile Form Setup
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      full_name: user?.name || '',
      phone: ''
    }
  });

  // Password Form Setup
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm({
    defaultValues: {
      current_password: '',
      new_password: ''
    }
  });

  const onUpdateProfile = async (data) => {
    setProfileLoading(true);
    const result = await updateProfile(data);
    setProfileLoading(false);

    if (result.success) {
      toast.success('Profile details updated successfully!');
    } else {
      toast.error(result.message);
    }
  };

  const onUpdatePassword = async (data) => {
    setPasswordLoading(true);
    const result = await changePassword(data.current_password, data.new_password);
    setPasswordLoading(false);

    if (result.success) {
      toast.success('Account password updated successfully!');
      resetPasswordForm();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* User Information Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-6 h-fit">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-500 text-3xl border-2 border-brand-500/20">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{user?.name}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-widest">{user?.role}</span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-150 dark:border-slate-800 text-sm">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-350">
            <FiMail className="w-4 h-4 text-slate-400" />
            <span className="truncate">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-355">
            <FiShield className="w-4 h-4 text-slate-400" />
            <span>Assigned node authorization: {user?.role}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile & Password Forms */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-5 uppercase tracking-wider flex items-center gap-2">
            <FiUser className="text-brand-500" /> General Profile Settings
          </h3>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">Full Name</label>
              <input
                type="text"
                {...registerProfile('full_name', { required: 'Name is required' })}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all ${
                  profileErrors.full_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {profileErrors.full_name && <span className="text-xs text-red-500 font-semibold">{profileErrors.full_name.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 019-2834"
                {...registerProfile('phone')}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-brand-600/10 cursor-pointer"
              >
                {profileLoading ? 'Updating Details...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-5 uppercase tracking-wider flex items-center gap-2">
            <FiKey className="text-brand-500" /> Change Security Password
          </h3>

          <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...registerPassword('current_password', { required: 'Current password is required' })}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all ${
                  passwordErrors.current_password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {passwordErrors.current_password && <span className="text-xs text-red-500 font-semibold">{passwordErrors.current_password.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">New Secure Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...registerPassword('new_password', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all ${
                  passwordErrors.new_password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {passwordErrors.new_password && <span className="text-xs text-red-500 font-semibold">{passwordErrors.new_password.message}</span>}
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-brand-600/10 cursor-pointer"
              >
                {passwordLoading ? 'Updating Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
