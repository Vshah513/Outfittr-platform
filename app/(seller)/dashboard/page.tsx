'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PlanLimitsBanner } from '@/components/monetization/PlanLimitsBanner';
import { BoostButton } from '@/components/monetization/BoostButton';
import { MAX_ACTIVE_LISTINGS_NEW_SELLER } from '@/lib/seller-limits';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [soldProducts, setSoldProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAsSold, setMarkingAsSold] = useState<string | null>(null);
  const [markingAsActive, setMarkingAsActive] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    totalEarnings: 0,
  });
  const [sellerActivated, setSellerActivated] = useState<boolean | null>(null);
  const [sellerTrustStatus, setSellerTrustStatus] = useState<string | null>(null);

  // Require authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnTo=/dashboard');
    }
  }, [user, authLoading, router]);

  // Require seller activation; redirect to onboarding if not activated
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/seller-profile')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.activated === true) {
          setSellerActivated(true);
          setSellerTrustStatus(data.trustStatus ?? null);
        } else {
          router.replace('/sell/onboarding?from=dashboard');
        }
      })
      .catch(() => {
        if (!cancelled) setSellerActivated(false);
      });
    return () => { cancelled = true; };
  }, [user, router]);

  useEffect(() => {
    if (user && sellerActivated) {
      fetchSellerProducts();
    }
  }, [user, sellerActivated]);

  const fetchSellerProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch active products
      const response = await fetch(`/api/sellers/${user?.id}?tab=active`);
      const data = await response.json();
      
      if (response.ok && data.data) {
        const sellerData = data.data;
        const activeProducts = sellerData.listings || [];
        
        // Fetch draft products (if API supports it)
        let draftProducts: any[] = [];
        try {
          const draftResponse = await fetch(`/api/sellers/${user?.id}?tab=draft`);
          const draftData = await draftResponse.json();
          draftProducts = draftResponse.ok && draftData.data ? draftData.data.listings : [];
        } catch (error) {
          // Draft tab might not be supported, that's okay
          console.log('Draft products fetch skipped');
        }
        
        // Fetch sold products for the Sold Items section and earnings calculation
        let fetchedSoldProducts: any[] = [];
        let totalEarnings = 0;
        try {
          const soldResponse = await fetch(`/api/sellers/${user?.id}?tab=sold&listingsLimit=1000`);
          const soldData = await soldResponse.json();
          fetchedSoldProducts = soldResponse.ok && soldData.data ? soldData.data.listings : [];
          
          // Calculate earnings from sold products
          totalEarnings = fetchedSoldProducts.reduce((sum: number, p: any) => {
            return sum + Number(p.price || 0);
          }, 0);
        } catch (error) {
          console.error('Error fetching sold products:', error);
          // Fallback: try analytics API
          try {
            const analyticsResponse = await fetch('/api/analytics/seller');
            const analyticsData = await analyticsResponse.json();
            if (analyticsResponse.ok && analyticsData.analytics?.overview?.totalEarnings) {
              totalEarnings = analyticsData.analytics.overview.totalEarnings;
            }
          } catch (analyticsError) {
            console.error('Error fetching analytics:', analyticsError);
          }
        }
        
        // Separate active/draft products from sold products
        const allProducts = [...activeProducts, ...draftProducts];
        setProducts(allProducts);
        setSoldProducts(fetchedSoldProducts);
        
        // Get real-time total views from API response (calculated from product_views table)
        const totalViews = sellerData.total_views || 0;
        
        setStats({
          activeListings: activeProducts.filter((p: any) => p.status === 'active').length,
          totalViews,
          totalEarnings,
        });
      }
    } catch (error) {
      console.error('Error fetching seller products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsSold = async (productId: string) => {
    if (!confirm('Are you sure you want to mark this item as sold?')) {
      return;
    }

    setMarkingAsSold(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sold' }),
      });

      if (response.ok) {
        // Refresh the data to update listings and earnings
        // Small delay to ensure database triggers have processed
        setTimeout(async () => {
          await fetchSellerProducts();
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`Failed to mark item as sold: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error marking product as sold:', error);
      alert('Failed to mark item as sold. Please try again.');
    } finally {
      setMarkingAsSold(null);
    }
  };

  const markAsActive = async (productId: string) => {
    if (!confirm('Did you mark this item as sold by accident? This will move it back to your active listings.')) {
      return;
    }

    setMarkingAsActive(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (response.ok) {
        // Refresh the data to update listings and earnings
        // Small delay to ensure database triggers have processed
        setTimeout(async () => {
          await fetchSellerProducts();
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`Failed to undo sale: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error marking product as active:', error);
      alert('Failed to undo sale. Please try again.');
    } finally {
      setMarkingAsActive(null);
    }
  };

  // Show loading while checking auth or seller activation
  if (authLoading || !user || (user && sellerActivated === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text)] mb-4"></div>
          <p className="text-[var(--text-2)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:justify-between md:items-center md:gap-0">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-2)] hover:text-[var(--text)] mb-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
            <h1 className="text-2xl font-bold md:text-3xl text-[var(--text)]">Seller Dashboard</h1>
            <p className="text-[var(--text-2)] mt-1 md:mt-2 text-sm md:text-base">Manage your listings and sales</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/plan">
              <Button variant="outline" size="sm" className="whitespace-nowrap !text-xs !px-3 !py-2 md:!px-6 md:!py-3 md:!text-lg">
                Manage Plan
              </Button>
            </Link>
            <Link href="/listings/new">
              <Button variant="primary" size="sm" className="whitespace-nowrap !text-xs !px-3 !py-2 md:!px-6 md:!py-3 md:!text-lg">
                + New Listing
              </Button>
            </Link>
          </div>
        </div>

        {sellerTrustStatus === 'new' && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-2)]">
            New seller limits: up to {MAX_ACTIVE_LISTINGS_NEW_SELLER} active listings until you complete 3 successful sales.
          </div>
        )}

        {/* Plan Limits Banner */}
        <div className="mb-6">
          <PlanLimitsBanner />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-emerald-600">{stats.activeListings}</div>
              <div className="text-[var(--text-2)] mt-1">Active Listings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{stats.totalViews}</div>
              <div className="text-[var(--text-2)] mt-1">Total Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600">{formatPrice(stats.totalEarnings)}</div>
              <div className="text-[var(--text-2)] mt-1">Total Earnings</div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--text)]">Your Listings</h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-[var(--text-2)]">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--text-2)] mb-4">You haven&apos;t created any listings yet</p>
                <Link href="/listings/new">
                  <Button variant="primary">Create Your First Listing</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {products.filter(p => p.status !== 'sold').map((product) => (
                  <div key={product.id} className="flex flex-col gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors sm:flex-row sm:gap-3 sm:items-center">
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img 
                          src={product.images[0] || '/placeholder.jpg'} 
                          alt={product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--text)] truncate text-sm">{product.title}</h3>
                        <p className="text-xs text-[var(--text-3)] mt-0.5">{product.category} • {product.subcategory}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="text-base font-bold text-[var(--text)]">{formatPrice(product.price)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            product.status === 'active' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                            'bg-[var(--surface-2)] text-[var(--text-2)]'
                          }`}>
                            {product.status}
                          </span>
                          <span className="text-xs text-[var(--text-3)]">{product.view_count || 0} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 flex-shrink-0 border-t border-[var(--divider)] pt-3 sm:border-t-0 sm:pt-0">
                      {product.status === 'active' && (
                        <BoostButton 
                          product={{ id: product.id, title: product.title }}
                          userPhone={user?.phone_number}
                          variant="small"
                        />
                      )}
                      <Link href={`/product/${product.id}`}>
                        <Button variant="outline" size="sm" className="whitespace-nowrap">View</Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/listings/edit/${product.id}`)}
                        className="whitespace-nowrap"
                      >
                        Edit
                      </Button>
                      {product.status === 'active' && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => markAsSold(product.id)}
                          disabled={markingAsSold === product.id}
                          className="whitespace-nowrap"
                        >
                          {markingAsSold === product.id ? 'Marking...' : 'Mark as Sold'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sold Items Section */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--text)]">Sold Items</h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-[var(--text-2)]">Loading...</div>
            ) : soldProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--text-2)]">You haven&apos;t sold any items yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {soldProducts.map((product) => (
                  <div key={product.id} className="flex flex-col gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors sm:flex-row sm:gap-3 sm:items-center">
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img 
                          src={product.images[0] || '/placeholder.jpg'} 
                          alt={product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--text)] truncate text-sm">{product.title}</h3>
                        <p className="text-xs text-[var(--text-3)] mt-0.5">{product.category} • {product.subcategory}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="text-base font-bold text-[var(--text)]">{formatPrice(product.price)}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            sold
                          </span>
                          <span className="text-xs text-[var(--text-3)]">{product.view_count || 0} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 flex-shrink-0 border-t border-[var(--divider)] pt-3 sm:border-t-0 sm:pt-0">
                      <Link href={`/product/${product.id}`}>
                        <Button variant="outline" size="sm" className="whitespace-nowrap">View</Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markAsActive(product.id)}
                        disabled={markingAsActive === product.id}
                        className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 whitespace-nowrap"
                      >
                        {markingAsActive === product.id ? 'Undoing...' : 'Did you mark this by accident? Undo'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

