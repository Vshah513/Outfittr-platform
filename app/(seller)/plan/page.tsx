'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { SubscriptionTierId, BOOST_PACKAGES } from '@/types';

interface PlanData {
  plan: {
    tier_id: SubscriptionTierId;
    tier_name: string;
    price_kes: number;
    active_listings_limit: number | null;
    is_active: boolean;
    current_period_end: string | null;
    cancel_at_period_end?: boolean;
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

interface ActiveBoost {
  id: string;
  product_id: string;
  boost_type: string;
  ends_at: string;
  product?: {
    id: string;
    title: string;
    images: string[];
  };
}

function PlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Check for payment callback
  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    console.log('Payment callback check:', { ref, trxref, searchParams: Object.fromEntries(searchParams.entries()) });
    
    if (ref || trxref) {
      console.log('Payment reference found, verifying payment...', ref || trxref);
      verifyPayment(ref || trxref!);
    }
  }, [searchParams]);

  // Verify payment from callback
  const verifyPayment = async (reference: string) => {
    setVerifyingPayment(true);
    try {
      const response = await fetch(`/api/payments/paystack/verify?reference=${reference}`);
      const data = await response.json();

      if (data.status === 'success') {
        setShowSuccess(true);
        
        // Clear URL params immediately
        router.replace('/plan');
        
        // Force immediate refresh - multiple times to ensure it updates
        await fetchPlanData();
        
        // Refresh plan data with aggressive retry logic
        let retries = 0;
        const maxRetries = 15;
        const checkPlan = async () => {
          try {
            const freshResponse = await fetch('/api/subscriptions?t=' + Date.now()); // Cache bust
            if (freshResponse.ok) {
              const freshData = await freshResponse.json();
              console.log(`[Plan Refresh] Attempt ${retries + 1}/${maxRetries} - Current plan:`, freshData.plan?.tier_id);
              
              // Update state with fresh data
              setPlanData(freshData);
              
              // If still free tier and we haven't maxed retries, try again
              if (retries < maxRetries && freshData.plan?.tier_id === 'free') {
                retries++;
                setTimeout(checkPlan, 800); // Check every 800ms
              } else if (freshData.plan?.tier_id !== 'free') {
                console.log('✅ Plan successfully updated to:', freshData.plan?.tier_id);
                setShowSuccess(true);
              } else if (retries >= maxRetries) {
                console.warn('⚠️ Plan refresh timed out - still showing free tier. Please refresh the page manually.');
                alert('Payment successful! Please refresh the page to see your updated plan.');
              }
            }
          } catch (error) {
            console.error('Error checking plan:', error);
            if (retries < maxRetries) {
              retries++;
              setTimeout(checkPlan, 1000);
            }
          }
        };
        
        // Start checking immediately
        setTimeout(checkPlan, 500);
      } else if (data.status === 'pending') {
        // Still pending, maybe show a message
        alert('Payment is still being processed. Please check back in a moment.');
        // Still refresh in case it completes
        setTimeout(fetchPlanData, 2000);
      } else {
        alert(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Error verifying payment. Please refresh the page to check your plan status.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Protect page
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnTo=/plan');
    }
  }, [user, authLoading, router]);

  const fetchPlanData = async () => {
    try {
      const [planResponse, tiersResponse, boostsResponse] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/subscriptions/tiers'),
        fetch('/api/boosts'),
      ]);

      if (planResponse.ok) {
        const data = await planResponse.json();
        console.log('Fetched plan data:', data);
        setPlanData(data);
        setPhoneNumber(user?.phone_number || '');
      } else {
        console.error('Failed to fetch plan:', await planResponse.text());
      }

      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        setTiers(tiersData.tiers || []);
      } else {
        console.error('Failed to fetch tiers:', await tiersResponse.text());
      }

      if (boostsResponse.ok) {
        const boostsData = await boostsResponse.json();
        setActiveBoosts(boostsData.activeBoosts || []);
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlanData();
    }
  }, [user]);

  const handleUpgrade = async (tierId: SubscriptionTierId) => {
    if (tierId === 'free') return;

    setUpgradeLoading(tierId);

    try {
      // Always use Paystack - it handles both card and M-Pesa
      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'subscription',
          tierId,
          // For M-Pesa, phone is optional since Paystack checkout handles it
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to initialize payment';
        console.error('Payment initialization error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (data.type === 'redirect' && data.url) {
        // Redirect to Paystack checkout page
        window.location.href = data.url;
      } else {
        alert('Payment initialized. Please follow the instructions.');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to upgrade plan. Please try again.';
      alert(errorMessage);
    } finally {
      setUpgradeLoading(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (verifyingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  const currentTier = planData?.plan.tier_id || 'free';
  const tierOrder = tiers.map(t => t.id);
  const currentIndex = tierOrder.indexOf(currentTier);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Payment Successful!</h3>
              <p className="text-sm text-green-700">Your plan has been upgraded. Enjoy your new features!</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-600 hover:text-green-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Seller Plans</h1>
            <button
              onClick={fetchPlanData}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh plan status"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">
            Choose the plan that fits your selling needs. Pay with M-Pesa or Card.
          </p>
        </div>

        {/* Current Plan Summary */}
        {planData && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentTier === 'free' 
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {planData.plan.tier_name} Plan
                    </span>
                    {planData.plan.current_period_end && (
                      <span className="text-sm text-gray-500">
                        {planData.plan.cancel_at_period_end 
                          ? `Expires ${new Date(planData.plan.current_period_end).toLocaleDateString()}`
                          : `Renews ${new Date(planData.plan.current_period_end).toLocaleDateString()}`
                        }
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {planData.usage.current_listings} of {planData.usage.limit || '∞'} listings used
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        planData.usage.percentage >= 100 ? 'bg-red-500' :
                        planData.usage.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(planData.usage.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {planData.usage.percentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Pay with M-Pesa or Card</h3>
              <p className="text-sm text-white/90">
                Secure payments powered by Paystack. Supports M-Pesa, Visa, Mastercard.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.length === 0 && isLoading ? (
            <div className="col-span-4 text-center py-8 text-gray-500">Loading plans...</div>
          ) : tiers.length === 0 ? (
            <div className="col-span-4 text-center py-8 text-red-500">Failed to load plans. Please refresh.</div>
          ) : (
            tiers.map((tier) => {
              const tierIndex = tierOrder.indexOf(tier.id);
              const isCurrentPlan = tier.id === currentTier;
              const isUpgrade = tierIndex > currentIndex;
              const isDowngrade = tierIndex < currentIndex;

            return (
              <Card 
                key={tier.id}
                className={`relative overflow-hidden ${
                  tier.id === 'growth' ? 'ring-2 ring-emerald-500' : ''
                } ${isCurrentPlan ? 'bg-emerald-50' : ''}`}
              >
                {tier.id === 'growth' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                    Popular
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {tier.price_kes === 0 ? 'Free' : formatPrice(tier.price_kes)}
                    </span>
                    {tier.price_kes > 0 && (
                      <span className="text-gray-500">/month</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-sm text-gray-600">
                      {tier.active_listings_limit 
                        ? `Up to ${tier.active_listings_limit} active listings`
                        : 'Unlimited active listings'
                      }
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {(Array.isArray(tier.features) ? tier.features : []).map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button variant="outline" className="w-full" disabled>
                      Downgrade
                    </Button>
                  ) : tier.id === 'free' ? (
                    <Button variant="outline" className="w-full" disabled>
                      Free
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={upgradeLoading === tier.id}
                    >
                      {upgradeLoading === tier.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        `Upgrade to ${tier.name}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
          )}
        </div>

        {/* Active Boosts Section */}
        {activeBoosts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-semibold">Active Boosts</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeBoosts.map((boost) => (
                  <div 
                    key={boost.id}
                    className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg"
                  >
                    {boost.product?.images?.[0] && (
                      <img 
                        src={boost.product.images[0]} 
                        alt={boost.product.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {boost.product?.title || 'Product'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {boost.boost_type === 'homepage_carousel' ? 'Featured' : 'Category Boost'}
                        {' · '}
                        Expires {new Date(boost.ends_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-medium">Boosted</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boost Packages */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Boost Your Listings</h2>
            <p className="text-gray-600 text-sm">Get more visibility for your products. Pay with M-Pesa.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(BOOST_PACKAGES).map((pkg) => (
                <div 
                  key={pkg.id}
                  className={`p-4 rounded-xl border-2 ${
                    pkg.boost_type === 'homepage_carousel' 
                      ? 'border-amber-300 bg-amber-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    {pkg.boost_type === 'homepage_carousel' && (
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                        Best
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(pkg.price_kes)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      / {pkg.duration_hours < 48 ? `${pkg.duration_hours}h` : `${Math.round(pkg.duration_hours / 24)} days`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Boost individual listings from your dashboard or product pages
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <PlanContent />
    </Suspense>
  );
}
