import React, { useState } from 'react';
import { useLeave, MONTH_NAMES } from '../context/LeaveContext';

export default function ProfilePage() {
  const { user, updatePassword, updateUserProfile, logout, setActiveTab, refreshData } = useLeave();

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Joining Month/Year State
  const [joinMonth, setJoinMonth] = useState(user?.joinMonth || 10);
  const [joinYear, setJoinYear] = useState(user?.joinYear || 2026);
  const [isSavingJoinDate, setIsSavingJoinDate] = useState(false);
  const [joinDateSavedMsg, setJoinDateSavedMsg] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setIsSavingProfile(true);
    await updateUserProfile({
      name: profileName.trim(),
    });
    setIsSavingProfile(false);
    setIsEditingProfile(false);
  };

  const handleJoinDateSave = async (e) => {
    e.preventDefault();
    setIsSavingJoinDate(true);
    setJoinDateSavedMsg(false);

    const res = await updateUserProfile({
      joinMonth: Number(joinMonth),
      joinYear: Number(joinYear),
    });

    setIsSavingJoinDate(false);
    if (res?.success) {
      setJoinDateSavedMsg(true);
      if (typeof refreshData === 'function') {
        await refreshData();
      }
      setTimeout(() => setJoinDateSavedMsg(false), 3000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: 'Please fill in all fields.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const res = await updatePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setMessage({ text: 'Password successfully changed!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ text: res.error || 'Failed to update password.', type: 'error' });
    }
  };

  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="text-left">
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Profile & Account
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-0.5">
          Manage your account credentials and system settings.
        </p>
      </div>

      {/* QUICK SHORTCUT: LEAVE LOGIC & RULES BUTTON */}
      <div className="w-full p-4 sm:p-5 rounded-[22px] bg-gradient-to-r from-primary-fixed/30 to-secondary-fixed/20 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[22px]">menu_book</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-on-surface">
              Leave Rules & Policy Guide
            </h3>
            <p className="text-xs text-on-surface-variant">
              Weekend rules, Friday & Monday sandwich policy, and recalculations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary hover:bg-[#4834c9] shadow-sm transition-all shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>View Rules</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* Profile Details Card */}
      <div className="w-full bg-surface-container-lowest rounded-[22px] p-5 sm:p-7 shadow-sm border border-surface-container/80 flex flex-col gap-5">
        {/* User Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-surface-container gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center border border-primary/20 shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[26px] sm:text-[30px]">person</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-on-surface truncate">
                {user?.name || 'User Account'}
              </h2>
              <p className="text-xs text-on-surface-variant truncate mt-0.5">
                {user?.email || 'Logged in user'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {!isEditingProfile ? (
              <button
                type="button"
                onClick={() => {
                  setProfileName(user?.name || '');
                  setIsEditingProfile(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors border border-surface-container active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit Name</span>
              </button>
            ) : null}

            <button
              onClick={logout}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-error hover:bg-error-container/30 rounded-xl transition-colors border border-error/20 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dynamic Edit Profile Form */}
        {isEditingProfile ? (
          <form onSubmit={handleProfileSave} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                placeholder="Enter your full name"
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm font-semibold rounded-xl outline-none border border-surface-container focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile || !profileName.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSavingProfile ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">check</span>
                    <span>Save Name</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Profile Info */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Full Name
              </label>
              <div className="flex items-center p-3 rounded-xl bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0">badge</span>
                  <span className="text-xs sm:text-sm font-semibold text-on-surface truncate">
                    {user?.name || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Email Address
              </label>
              <div className="flex items-center p-3 rounded-xl bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0">mail</span>
                  <span className="text-xs sm:text-sm font-semibold text-on-surface truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employment & Joining Date Card */}
      <div className="w-full bg-surface-container-lowest rounded-[22px] p-5 sm:p-7 shadow-sm border border-surface-container/80 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-base font-bold text-on-surface">
                Employment & Joining Date
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Monthly +2.0d accrual starts strictly from your joining month.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleJoinDateSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Joining Month
              </label>
              <select
                value={joinMonth}
                onChange={(e) => setJoinMonth(Number(e.target.value))}
                className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-sm font-semibold rounded-xl outline-none border border-surface-container focus:border-primary"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m} (Month {idx + 1})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Joining Year
              </label>
              <input
                type="number"
                min="2020"
                max="2035"
                value={joinYear}
                onChange={(e) => setJoinYear(Number(e.target.value))}
                required
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm font-semibold rounded-xl outline-none border border-surface-container focus:border-primary"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              <span>
                Accrual begins: <strong className="text-on-surface">{MONTH_NAMES[(user?.joinMonth || 10) - 1]} {user?.joinYear || 2026}</strong>
              </span>
            </div>

            {joinDateSavedMsg && (
              <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs animate-in fade-in">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Saved & recalculated!
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingJoinDate}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSavingJoinDate ? (
                <>
                  <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">save</span>
                  <span>Update Joining Date</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="w-full bg-surface-container-lowest rounded-[22px] p-5 sm:p-7 shadow-sm border border-surface-container/80">
        <div className="pb-4 border-b border-surface-container">
          <h2 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
            Change Password
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Ensure your account uses a secure password.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="pt-5 space-y-4">
          {message.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                  : 'bg-error-container/40 text-on-error-container border-error/20'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{message.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
              className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-label-md text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
