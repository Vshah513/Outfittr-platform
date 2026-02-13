'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountHubPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?returnTo=/account');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
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

  const sellerActivated = Boolean((user as { seller_activated?: boolean }).seller_activated);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--bg)]">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Account</h1>
          <p className="text-sm text-[var(--text-2)] mb-8">Manage your buying and selling.</p>

          <div className="space-y-6">
            {/* Buyer card */}
            <Card className="border-[var(--border)]">
              <CardHeader>
                <h2 className="text-lg font-semibold text-[var(--text)]">Buyer</h2>
                <p className="text-sm text-[var(--text-2)]">Saved items, orders, and settings</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link
                  href="/saved"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <svg className="w-5 h-5 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">Saved items</span>
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <svg className="w-5 h-5 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="font-medium">My purchases / Orders</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <svg className="w-5 h-5 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Settings</span>
                </Link>
              </CardContent>
            </Card>

            {/* Seller card */}
            <Card className="border-[var(--border)]">
              <CardHeader>
                <h2 className="text-lg font-semibold text-[var(--text)]">Seller</h2>
                {!sellerActivated ? (
                  <p className="text-sm text-[var(--text-2)]">List in minutes • Get paid via M-Pesa • Nairobi-first</p>
                ) : (
                  <p className="text-sm text-[var(--text-2)]">Manage your listings and sales</p>
                )}
              </CardHeader>
              <CardContent>
                {!sellerActivated ? (
                  <>
                    <p className="text-xs text-[var(--text-3)] mb-4">Buyers pay sellers directly. Transact safely.</p>
                    <Link
                      href="/sell/onboarding"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-opacity"
                    >
                      Start selling
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-opacity"
                  >
                    Seller dashboard
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
