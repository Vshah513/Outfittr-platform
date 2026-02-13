'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import Step0Prescreen from '@/components/sell/onboarding/Step0Prescreen';
import Step1Basics from '@/components/sell/onboarding/Step1Basics';
import Step2Location from '@/components/sell/onboarding/Step2Location';
import Step3Verification from '@/components/sell/onboarding/Step3Verification';
import Step4Rules from '@/components/sell/onboarding/Step4Rules';
import type { SellerProfile } from '@/types';

const STEPS = [
  { number: 0, title: 'Start' },
  { number: 1, title: 'Basics' },
  { number: 2, title: 'Location' },
  { number: 3, title: 'Verification' },
  { number: 4, title: 'Rules' },
];

export default function SellOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<SellerProfile | null | undefined>(undefined);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnTo=/sell/onboarding');
      return;
    }
    if (!user) return;

    fetch('/api/seller-profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.activated === true) {
          router.replace('/dashboard');
          return;
        }
        setProfile(data.profile ?? null);
        const nextStep = data.onboardingStep ?? 0;
        setStep(Math.min(Math.max(0, nextStep), 4));
      })
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [user, authLoading, router]);

  const handleStep0Continue = () => setStep(1);

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
      setStep(2);
      setProfile((prev) => (prev ? { ...prev, ...json.profile } : json.profile));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStep2Next = async (data: {
    nairobiArea: string;
    meetupZones: string[];
    deliveryPreference: 'pickup' | 'delivery' | 'both';
    deliveryFeeRange?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/seller-profile', {
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setStep(3);
      setProfile((prev) => (prev ? { ...prev, ...json.profile } : json.profile));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStep3Next = async (data: {
    legalName: string;
    dob: string;
    selfieUrl: string;
    agreedToRules: boolean;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/seller-profile', {
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setStep(4);
      setProfile((prev) => (prev ? { ...prev, ...json.profile } : json.profile));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStep4Submit = async (rules: {
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
      router.replace('/dashboard');
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
              Step {step + 1} of 5
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
            {step === 0 && <Step0Prescreen onContinue={handleStep0Continue} />}
            {step === 1 && (
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
            )}
            {step === 2 && (
              <Step2Location
                initial={{
                  nairobiArea: profile?.nairobi_area ?? undefined,
                  meetupZones: profile?.meetup_zones ?? undefined,
                  deliveryPreference: profile?.delivery_preference ?? undefined,
                  deliveryFeeRange: profile?.delivery_fee_range ?? undefined,
                }}
                onNext={handleStep2Next}
                isLoading={saving}
              />
            )}
            {step === 3 && (
              <Step3Verification
                initial={{
                  legalName: profile?.legal_name ?? undefined,
                  dob: profile?.dob ?? undefined,
                  selfieUrl: profile?.selfie_url ?? undefined,
                  agreedToRules: profile?.agreed_to_rules ?? undefined,
                }}
                onNext={handleStep3Next}
                isLoading={saving}
              />
            )}
            {step === 4 && (
              <Step4Rules onSubmit={handleStep4Submit} isLoading={saving} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
