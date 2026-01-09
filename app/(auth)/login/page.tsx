'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    if (user) {
      // Already logged in, redirect
      const returnTo = searchParams.get('returnTo') || '/marketplace';
      router.replace(returnTo);
      } else {
      // Open auth modal with params
      const returnTo = searchParams.get('returnTo') || undefined;
      const mode = (searchParams.get('mode') as 'signin' | 'signup') || 'signin';
      openAuthModal(returnTo, undefined, mode);
    }
  }, [user, searchParams, openAuthModal, router]);

  // Minimal page (modal will render on top)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
