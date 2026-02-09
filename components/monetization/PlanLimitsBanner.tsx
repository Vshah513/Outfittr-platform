'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SubscriptionTierId } from '@/types';

interface PlanData {
  plan: {
    tier_id: SubscriptionTierId;
    tier_name: string;
    price_kes: number;
    active_listings_limit: number | null;
    is_active: boolean;
    current_period_end: string | null;
  };
  usage: {
    current_listings: number;
    limit: number;
    percentage: number;
  };
  canCreateListing: boolean;
}

interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  price_kes: number;
  active_listings_limit: number | null;
  features: string[];
}

export function PlanLimitsBanner() {
  const [data, setData] = useState<PlanData | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const [planResponse, tiersResponse] = await Promise.all([
          fetch('/api/subscriptions'),
          fetch('/api/subscriptions/tiers'),
        ]);
        
        if (planResponse.ok) {
          const planData = await planResponse.json();
          setData(planData);
        }
        
        if (tiersResponse.ok) {
          const tiersData = await tiersResponse.json();
          setTiers(tiersData.tiers || []);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-[var(--surface-2)] rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-[var(--divider)] rounded w-1/3 mb-2"></div>
        <div className="h-2 bg-[var(--divider)] rounded w-full"></div>
      </div>
    );
  }

  if (!data) return null;

  const { plan, usage, canCreateListing } = data;
  const isAtLimit = usage.percentage >= 100;
  const isNearLimit = usage.percentage >= 80;
  const isPaidPlan = plan.tier_id !== 'free';

  // Determine the upgrade tier from API data
  const tierOrder = tiers.map(t => t.id);
  const currentIndex = tierOrder.indexOf(plan.tier_id);
  const nextTier = currentIndex < tierOrder.length - 1 ? tiers[currentIndex + 1] : null;

  return (
    <div className={`rounded-xl p-4 border ${
      isAtLimit 
        ? 'bg-[var(--sale-red)]/10 border-[var(--sale-red)]/30' 
        : isNearLimit 
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-[var(--surface-2)] border-[var(--border)]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
            isPaidPlan 
              ? 'bg-[var(--success)]/20 text-[var(--success)]' 
              : 'bg-[var(--surface-2)] text-[var(--text-2)]'
          }`}>
            {plan.tier_name} Plan
          </span>
          {isPaidPlan && plan.current_period_end && (
            <span className="text-xs text-[var(--text-3)]">
              Renews {new Date(plan.current_period_end).toLocaleDateString()}
            </span>
          )}
        </div>
        {nextTier && (
          <Link 
            href="/plan"
            className="text-sm font-medium text-[var(--success)] hover:opacity-90"
          >
            Upgrade →
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--text-2)]">Active Listings</span>
          <span className={`font-medium ${
            isAtLimit ? 'text-[var(--sale-red)]' : isNearLimit ? 'text-amber-500' : 'text-[var(--text)]'
          }`}>
            {usage.current_listings} / {usage.limit === null ? '∞' : usage.limit}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-[var(--surface-2)]">
          <div 
            className={`h-full rounded-full transition-all ${
              isAtLimit 
                ? 'bg-[var(--sale-red)]' 
                : isNearLimit 
                  ? 'bg-amber-500' 
                  : 'bg-[var(--success)]'
            }`}
            style={{ width: `${Math.min(usage.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Warning/CTA Message */}
      {isAtLimit && nextTier && (
        <div className="mt-3 flex items-center justify-between rounded-lg p-3 bg-[var(--surface)] border border-[var(--border)]">
          <div>
            <p className="text-sm font-medium text-[var(--sale-red)]">
              You&apos;ve hit your listing limit
            </p>
            <p className="text-xs text-[var(--text-2)]">
              Upgrade to {nextTier.name} for {nextTier.active_listings_limit || 'unlimited'} listings
            </p>
          </div>
          <Link href="/plan">
            <button className="px-4 py-2 text-sm font-medium bg-[var(--success)] text-white rounded-lg hover:opacity-90 transition-colors">
              Upgrade for KSh {nextTier.price_kes}/mo
            </button>
          </Link>
        </div>
      )}

      {isNearLimit && !isAtLimit && nextTier && (
        <p className="text-xs text-amber-600 mt-2">
          Running low on listings? <Link href="/plan" className="underline font-medium">Upgrade to {nextTier.name}</Link> for more.
        </p>
      )}
    </div>
  );
}

