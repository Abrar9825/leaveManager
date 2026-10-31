import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function LoginPage() {
  const { login, registerUser } = useLeave();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Form states - clean inputs without forced demo values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide email and password.');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      const res = await registerUser(name.trim(), cleanEmail, password);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Failed to create account.');
      }
    } else {
      setIsSubmitting(true);
      const res = await login(cleanEmail, password);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-surface relative overflow-hidden">
      {/* Ambient Violet Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none ambient-glow"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[420px] bg-surface-container-lowest rounded-[24px] p-6 sm:p-8 shadow-card-elevation border border-surface-container/80 relative z-10 transition-all animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm mb-3">
            <span className="material-symbols-outlined text-[26px]">calendar_today</span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Leave Manager
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            {authMode === 'login'
              ? 'Sign in to access your dashboard & leave balance'
              : 'Create a new employee leave account'}
          </p>
        </div>

        {/* Auth Mode Toggle Switcher */}
        <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl gap-1 border border-surface-container/60 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError('');
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              authMode === 'login'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError('');
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              authMode === 'register'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container/40 text-on-error-container text-xs flex items-center gap-2 border border-error/20 animate-in fade-in">
              <span className="material-symbols-outlined text-[16px] text-error shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 mt-2 rounded-xl font-label-md text-sm font-semibold text-on-primary bg-primary hover:bg-[#4834c9] shadow-primary-btn hover:shadow-primary-btn-hover transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Connecting...</span>
              </>
            ) : (
              <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
