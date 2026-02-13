'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import Step0Prescreen from '@/components/sell/onboarding/Step0Prescreen';
import Step1Basics from '@/components/sell/onboarding/Step1Basics';
import Step2And3Combined from '@/components/sell/onboarding/Step2And3Combined';
import Step4Rules from '@/components/sell/onboarding/Step4Rules';
import type { SellerOnboardingProfile } from '@/types';

const STEPS = [
  { number: 0, title: 'Basics' },
  { number: 1, title: 'Location & verification' },
  { number: 2, title: 'Rules' },
];

export default function SellOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<SellerOnboardingProfile | null | undefined>(undefined);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      const currentPath = '/sell/onboarding' + (searchParams.get('returnTo') ? '?returnTo=' + encodeURIComponent(searchParams.get('returnTo')) : '');
      router.replace('/login?returnTo=' + encodeURIComponent(currentPath));
      return;
    }
    if (!user) return;

    fetch('/api/seller-profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.activated === true) {
          router.replace(returnTo);
          return;
        }
        setProfile(data.profile ?? null);
        const backendStep = data.onboardingStep ?? 0;
        const uiStep = backendStep <= 1 ? 0 : backendStep <= 3 ? 1 : 2;
        setStep(uiStep);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [user, authLoading, router, returnTo]);

  const handleStep1Next = async (data: { displayName: string; email: string; mpesaNumber: string; profilePhotoUrl?: string }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/seller-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1,
          displayName: data.displayName,
          email: data.email,
          mpesaNumber: data.mpesaNumber,
          profilePhotoUrl: data.profilePhotoUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setStep(1);
      setProfile((prev) => (prev ? { ...prev, ...json.profile } : json.profile));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStep2And3Next = async (data: import('@/components/sell/onboarding/Step2And3Combined').Step2And3Data) => {
    setSaving(true);
    try {
      const res2 = await fetch('/api/seller-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          nairobiArea: data.nairobiArea,
          meetupZones: data.meetupZones,
          deliveryPreference: data.deliveryPreference,
          deliveryFeeRange: data.deliveryFeeRange,
        }),
      });
      const json2 = await res2.json();
      if (!res2.ok) throw new Error(json2.error || 'Failed to save');
      const res3 = await fetch('/api/seller-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          legalName: data.legalName,
          dob: data.dob,
          selfieUrl: data.selfieUrl,
          agreedToRules: data.agreedToRules,
        }),
      });
      const json3 = await res3.json();
      if (!res3.ok) throw new Error(json3.error || 'Failed to save');
      setStep(2);
      setProfile((prev) => (prev ? { ...prev, ...json3.profile } : json3.profile));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleRulesSubmit = async (rules: {
    photosActualItem: boolean;
    discloseDefects: boolean;
    noCounterfeit: boolean;
    noSuspiciousDeposits: boolean;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/seller-profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to activate');
      await refreshUser();
      router.replace(returnTo);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to activate');
      setSaving(false);
    }
  };

  if (authLoading || !user || loadingProfile) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--text)]" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--bg)]">
        <div className="max-w-xl mx-auto px-4 py-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-2)] hover:text-[var(--text)] mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to account
          </Link>

          {/* Stepper */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wide text-[var(--text-2)] mb-2">
              Step {step + 1} of 3
            </p>
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => {
                const isActive = s.number === step;
                const isDone = s.number < step;
                return (
                  <div
                    key={s.number}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      isDone ? 'bg-[var(--text)]' : isActive ? 'bg-[var(--text)]' : 'bg-[var(--surface-2)]'
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-sm font-medium text-[var(--text)] mt-2">{STEPS[step]?.title}</p>
          </div>

          {/* Step content */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            {step === 0 && (
              <>
                <Step0Prescreen hideContinueButton />
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <Step1Basics
                    initial={{
                      displayName: profile?.display_name ?? undefined,
                      email: profile?.email ?? undefined,
                      mpesaNumber: profile?.mpesa_number ?? undefined,
                      profilePhotoUrl: profile?.profile_photo_url ?? undefined,
                    }}
                    userEmail={user.email}
                    onNext={handleStep1Next}
                    isLoading={saving}
                  />
                </div>
              </>
            )}
            {step === 1 && (
              <Step2And3Combined
                initial={{
                  nairobiArea: profile?.nairobi_area ?? undefined,
                  meetupZones: profile?.meetup_zones ?? undefined,
                  deliveryPreference: profile?.delivery_preference ?? undefined,
                  deliveryFeeRange: profile?.delivery_fee_range ?? undefined,
                  legalName: profile?.legal_name ?? undefined,
                  dob: profile?.dob ?? undefined,
                  selfieUrl: profile?.selfie_url ?? undefined,
                  agreedToRules: profile?.agreed_to_rules ?? undefined,
                }}
                onNext={handleStep2And3Next}
                isLoading={saving}
              />
            )}
            {step === 2 && (
              <Step4Rules onSubmit={handleRulesSubmit} isLoading={saving} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
