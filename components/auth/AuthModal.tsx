'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signInWithFacebook, signInWithEmail, registerWithEmail, sendPasswordResetEmail } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AuthTab = 'signin' | 'signup';
type Step = 'initial' | 'forgot-password' | 'reset-sent' | 'success' | 'new-password';

export default function AuthModal() {
  const { modalOpen, modalMode, modalInitialStep, closeAuthModal, returnUrl, refreshUser } = useAuth();
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [step, setStep] = useState<Step>('initial');
  // Track if we've already applied the initial step for this modal session
  const [appliedInitialStep, setAppliedInitialStep] = useState(false);
  
  // Use the initial step from context when modal opens
  useEffect(() => {
    if (modalOpen && modalInitialStep && !appliedInitialStep) {
      setStep(modalInitialStep);
      setAppliedInitialStep(true);
    }
  }, [modalOpen, modalInitialStep, appliedInitialStep]);
  
  // Reset the appliedInitialStep flag when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setAppliedInitialStep(false);
    }
  }, [modalOpen]);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  // Set initial tab based on modal mode
  useEffect(() => {
    if (modalOpen) {
      // Only set tab if we're in initial step
      if (step === 'initial') {
        setActiveTab(modalMode === 'signup' ? 'signup' : 'signin');
      }
    }
  }, [modalOpen, modalMode, step]);

  // Reset state when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setTimeout(() => {
        setStep('initial');
        setEmail('');
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setUsername('');
        setError('');
        setSuccessMessage('');
        setShowPassword(false);
      }, 300);
    }
  }, [modalOpen]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    const { error } = await signInWithGoogle(returnUrl);
    
    if (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    const { error } = await signInWithFacebook(returnUrl);
    
    if (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      setError(error);
      setIsLoading(false);
    } else {
      // Refresh user data and close modal
      console.log('Sign in successful, refreshing user...');
      await refreshUser();
      console.log('User refreshed, closing modal...');
      closeAuthModal();
      setIsLoading(false);
      if (returnUrl) {
        router.push(returnUrl);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-30 characters with only letters, numbers, and underscores');
      setIsLoading(false);
      return;
    }

    // Use username as display name for simplicity
    const { error, message, autoSignedIn } = await registerWithEmail(email, password, username, username);
    
    if (error) {
      setError(error);
      setIsLoading(false);
    } else if (autoSignedIn) {
      // Auto-signed in successfully - refresh user and close modal
      await refreshUser();
      closeAuthModal();
      setIsLoading(false);
    } else {
      // Registration succeeded but auto-sign-in failed - show success message
      setSuccessMessage(message || 'Account created! You can now sign in.');
      setStep('success');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error, message } = await sendPasswordResetEmail(email);
    
    if (error) {
      setError(error);
    } else {
      setSuccessMessage(message || 'Check your email for a reset link.');
      setStep('reset-sent');
    }
    setIsLoading(false);
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update password');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Password updated successfully! You can now sign in with your new password.');
      setStep('success');
      setIsLoading(false);
    } catch (err) {
      console.error('Password update error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const switchToSignIn = () => {
    setActiveTab('signin');
    setStep('initial');
    setError('');
    setSuccessMessage('');
    // Clear signup fields but keep email
    setPassword('');
    setUsername('');
  };

  if (!modalOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={closeAuthModal}
      />
      
      {/* Modal/Sheet - Responsive */}
      <div className="fixed inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[440px] z-50 flex items-end md:items-stretch">
        <div 
          className="w-full bg-[#FDFCF9] rounded-t-xl md:rounded-none shadow-2xl overflow-y-auto max-h-[90vh] md:max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-8 md:p-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                T
              </div>
              <span className="font-bold text-xl">Outfittr</span>
            </div>

            {/* Welcome Message */}
            <h1 className="font-serif text-3xl font-normal tracking-tight mb-2">
              {step === 'forgot-password' ? 'Reset Password' : 
               step === 'reset-sent' ? 'Check Your Email' :
               step === 'new-password' ? 'Set New Password' :
               step === 'success' ? 'Success!' :
               'Welcome'}
            </h1>
            
            {step === 'initial' && (
              <p className="text-gray-600 text-sm mb-6">
                {activeTab === 'signin' 
                  ? 'Sign in to continue' 
                  : 'Create your account to get started'}
              </p>
            )}

            {/* Tab Navigation */}
            {step === 'initial' && (
              <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => { setActiveTab('signin'); setError(''); }}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'signin'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setActiveTab('signup'); setError(''); }}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'signup'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Success message */}
            {successMessage && step !== 'initial' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            {/* Sign In Form */}
            {step === 'initial' && activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full h-12 px-4 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full h-12 px-4 pr-12 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('forgot-password')}
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Forgot password?
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#FDFCF9] text-gray-500">or continue with</span>
                  </div>
                </div>

                {/* Social Sign In Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border border-[#E8E4DD] rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-sm">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFacebookSignIn}
                    disabled={isLoading}
                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-medium text-sm">Facebook</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sign Up Form */}
            {step === 'initial' && activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full h-12 px-4 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="your_username"
                    required
                    autoComplete="username"
                    className="w-full h-12 px-4 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoComplete="new-password"
                      className="w-full h-12 px-4 pr-12 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#FDFCF9] text-gray-500">or continue with</span>
                  </div>
                </div>

                {/* Social Sign Up Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border border-[#E8E4DD] rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-sm">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFacebookSignIn}
                    disabled={isLoading}
                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-medium text-sm">Facebook</span>
                  </button>
                </div>
              </form>
            )}

            {/* Forgot Password Form */}
            {step === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full h-12 px-4 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('initial'); setError(''); }}
                  className="w-full text-sm text-gray-600 hover:text-black transition-colors py-2"
                >
                  ← Back to sign in
                </button>
              </form>
            )}

            {/* Reset Email Sent */}
            {step === 'reset-sent' && (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <p className="text-center text-gray-700">
                  We sent a password reset link to <strong>{email}</strong>
                </p>

                <button
                  onClick={() => { setStep('initial'); setSuccessMessage(''); }}
                  className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {/* Set New Password Form */}
            {step === 'new-password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">
                  Enter your new password below.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoFocus
                      autoComplete="new-password"
                      className="w-full h-12 px-4 pr-12 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    autoComplete="new-password"
                    className="w-full h-12 px-4 bg-white border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('initial'); setError(''); }}
                  className="w-full text-sm text-gray-600 hover:text-black transition-colors py-2"
                >
                  ← Back to sign in
                </button>
              </form>
            )}

            {/* Success State (Account Created or Password Reset) */}
            {step === 'success' && (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <p className="text-center text-gray-700">
                  {successMessage || 'Success! You can now sign in.'}
                </p>

                <button
                  onClick={switchToSignIn}
                  className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Sign In Now
                </button>
              </div>
            )}

            {/* Terms footer */}
            {step === 'initial' && (
              <div className="mt-8 pt-6 border-t border-[#E8E4DD]">
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-gray-700">Terms</Link>
                  {' '}&{' '}
                  <Link href="/privacy" className="underline hover:text-gray-700">Privacy</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
