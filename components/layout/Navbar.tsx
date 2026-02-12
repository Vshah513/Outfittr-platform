'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import ProfileDropdown from './ProfileDropdown';
import SellerLeaderboardModal from '@/components/leaderboard/SellerLeaderboardModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileJustOpenedRef = useRef(false);
  
  // Typing placeholder animation state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  
  // Typing animation effect
  useEffect(() => {
    const phrases = ['sweaters', 'vintage jackets', 'tshirts', 'baggy jeans'];
    const prefix = 'Search for ';
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;
    
    const type = () => {
      const currentPhrase = phrases[phraseIndex];
      
      if (isDeleting) {
        // Deleting characters
        charIndex--;
        setAnimatedPlaceholder(prefix + currentPhrase.substring(0, charIndex));
        
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeoutId = setTimeout(type, 300); // Pause before typing next
        } else {
          timeoutId = setTimeout(type, 50); // Delete speed
        }
      } else {
        // Typing characters
        charIndex++;
        setAnimatedPlaceholder(prefix + currentPhrase.substring(0, charIndex));
        
        if (charIndex === currentPhrase.length) {
          isDeleting = true;
          timeoutId = setTimeout(type, 1500); // Pause at end of word
        } else {
          timeoutId = setTimeout(type, 100); // Type speed
        }
      }
    };
    
    // Start the animation
    timeoutId = setTimeout(type, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Determine which placeholder to show
  const searchPlaceholder = (isSearchFocused || searchQuery) 
    ? 'Search for items...' 
    : animatedPlaceholder || 'Search for items...';

  const categories = [
    { name: 'Women', href: '/category/women', hasDropdown: true },
    { name: 'Men', href: '/category/men', hasDropdown: true },
    { name: 'Vintage', href: '/category/vintage' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Sales', href: '/sales', isSpecial: true },
  ];

  const womenCategories = {
    shopByCategory: [
      { name: 'Tops', href: '/category/women?subcategory=Tops' },
      { name: 'Jeans', href: '/category/women?subcategory=Jeans' },
      { name: 'Sweaters', href: '/category/women?subcategory=Sweaters' },
      { name: 'Skirts', href: '/category/women?subcategory=Skirts' },
      { name: 'Dresses', href: '/category/women?subcategory=Dresses' },
      { name: 'Coats & Jackets', href: '/category/women?subcategory=Coats%20%26%20Jackets' },
      { name: 'Shoes', href: '/category/women?subcategory=Shoes' },
      { name: 'Bags', href: '/category/women?subcategory=Bags' },
      { name: 'Accessories', href: '/category/women?subcategory=Accessories' },
      { name: 'Activewear', href: '/category/women?subcategory=Activewear' },
    ],
    featured: [
      { name: 'New arrivals', href: '/category/women?sortBy=newest' },
      { name: 'Best sellers', href: '/category/women?sortBy=popular' },
      { name: 'Under KES 1,500', href: '/category/women?maxPrice=1500' },
    ],
  };

  const menCategories = {
    shopByCategory: [
      { name: 'T-Shirts', href: '/category/men?subcategory=T-Shirts' },
      { name: 'Shirts', href: '/category/men?subcategory=Shirts' },
      { name: 'Hoodies', href: '/category/men?subcategory=Hoodies' },
      { name: 'Jeans', href: '/category/men?subcategory=Jeans' },
      { name: 'Trousers', href: '/category/men?subcategory=Trousers' },
      { name: 'Sweaters', href: '/category/men?subcategory=Sweaters' },
      { name: 'Coats & Jackets', href: '/category/men?subcategory=Coats%20%26%20Jackets' },
      { name: 'Shoes', href: '/category/men?subcategory=Shoes' },
      { name: 'Bags', href: '/category/men?subcategory=Bags' },
      { name: 'Accessories', href: '/category/men?subcategory=Accessories' },
    ],
    featured: [
      { name: 'New arrivals', href: '/category/men?sortBy=newest' },
      { name: 'Best sellers', href: '/category/men?sortBy=popular' },
      { name: 'Under KES 1,500', href: '/category/men?maxPrice=1500' },
    ],
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery)}&tab=for-you`);
    }
  };

  const handleSellClick = () => {
    if (!user) {
      openAuthModal('/listings/new', undefined, 'signin');
    } else {
      router.push('/listings/new');
    }
  };

  const handleProfileClick = () => {
    if (user) {
      profileJustOpenedRef.current = true;
      setShowProfileMenu(!showProfileMenu);
    } else {
      openAuthModal(undefined, undefined, 'signin');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowProfileMenu(false);
    router.push('/');
  };

  // Fetch saved items count when user is logged in (and when saved list changes)
  const refreshSavedCount = React.useCallback(() => {
    if (!user) {
      setSavedCount(0);
      return;
    }
    fetch('/api/saved-items')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        if (Array.isArray(json.data)) {
          const active = json.data.filter(
            (row: { product?: { status?: string } }) => row.product?.status === 'active'
          );
          setSavedCount(active.length);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    refreshSavedCount();
  }, [refreshSavedCount, pathname]);

  useEffect(() => {
    const handler = () => refreshSavedCount();
    window.addEventListener('saved-items-changed', handler);
    return () => window.removeEventListener('saved-items-changed', handler);
  }, [refreshSavedCount]);

  // Close dropdown when clicking outside (ignore first event on touch to avoid same-tap close)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (profileJustOpenedRef.current) {
        profileJustOpenedRef.current = false;
        return;
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <nav className="sticky top-0 left-0 right-0 z-[100] w-full flex-shrink-0 self-start border-b border-[var(--border)] bg-[var(--surface)]">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 pr-12">
            <img
              src="/collections/Black Logo.jpg"
              alt="Outfittr"
              className="h-20 w-auto object-contain"
              style={{ display: 'block' }}
            />
          </Link>

          {/* Search Bar - Desktop (in header row) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-4 py-2 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition-all bg-[var(--input-fill)] text-[var(--text)] placeholder-[var(--text-3)] focus:bg-[var(--surface)]"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-3)]"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Right Side Actions - Vintage Editorial Utility Row */}
          <div className="flex items-center gap-2 md:gap-5">
            {/* Saved Items - to the left of Sell */}
            <Link
              href={user ? '/saved' : '#'}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  openAuthModal('/saved', undefined, 'signin');
                }
              }}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium tracking-wide uppercase rounded-full transition-all duration-200 shadow-sm relative bg-[var(--surface-2)] border border-[var(--brand)] text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--text-2)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 focus:ring-offset-[var(--surface)]"
              aria-label="Saved items"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span>Saved items</span>
              {user && savedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[var(--text)] text-[var(--bg)] text-xs font-bold rounded-full">
                  {savedCount > 99 ? '99+' : savedCount}
                </span>
              )}
            </Link>

            {/* Sell Button - Desktop */}
            <button
              onClick={handleSellClick}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium tracking-wide uppercase rounded-full transition-all duration-200 shadow-sm bg-[var(--surface-2)] border border-[var(--brand)] text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--text-2)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 focus:ring-offset-[var(--surface)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span>Sell</span>
            </button>

            {/* Mobile: Seller Leaderboard - small icon button */}
            <button
              type="button"
              onClick={() => setShowLeaderboardModal(true)}
              className="md:hidden p-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] transition-all hover:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 [touch-action:manipulation]"
              aria-label="Seller Leaderboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3H3a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236c-1.072.324-2.005.855-2.74 1.55m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c-.85.085-1.686.23-2.5.435m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c.85.085 1.686.23 2.5.435m0 0a3.75 3.75 0 01.439 5.439m-3.74-6.908a7.454 7.454 0 00.982 3.172M15.75 4.236c-1.072.324-2.005.855-2.74 1.55m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c.85.085 1.686.23 2.5.435m0 0a3.75 3.75 0 01.439 5.439m-3.74-6.908a7.454 7.454 0 01.982 3.172M9.497 11.078a7.454 7.454 0 00-.981 3.172M9.497 11.078c-.85.085-1.686.23-2.5.435" />
              </svg>
            </button>

            {/* Mobile: Sell an item - compact button */}
            <button
              type="button"
              onClick={handleSellClick}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase bg-[var(--text)] text-[var(--bg)] rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 [touch-action:manipulation]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Sell</span>
            </button>

            {/* Profile - far right (where menu was on mobile) */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={handleProfileClick}
                className="p-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface)] hover:border-[var(--text-2)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 shadow-sm [touch-action:manipulation]"
                aria-label={user ? 'Profile menu' : 'Sign in'}
              >
                {user && user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>

              {/* New Professional Profile Dropdown */}
              {user && showProfileMenu && (
                <ProfileDropdown user={user} onClose={() => setShowProfileMenu(false)} />
              )}
            </div>

            {/* Sign in - Quiet Text Link, desktop only (only when logged out) */}
            {!user && (
              <button
                onClick={() => openAuthModal(undefined, undefined, 'signin')}
                className="hidden md:block text-xs font-medium tracking-wide uppercase text-[var(--text-2)] hover:text-[var(--text)] transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 rounded px-1"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Always visible, Depop-style */}
      <div className="md:hidden border-t border-[var(--divider)] px-4 py-3">
        <form onSubmit={handleSearch}>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search for anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full px-4 py-2.5 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition-all text-base bg-[var(--input-fill)] text-[var(--text)] placeholder-[var(--text-3)] focus:bg-[var(--surface)]"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-3)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>
      </div>

      {/* Mobile Category Pills - Horizontal scroll, Depop-style */}
      <div className="md:hidden border-t overflow-x-auto scrollbar-hide border-[var(--divider)]">
        <div className="flex items-center gap-2 px-4 py-3 min-w-max">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                category.isSpecial
                  ? "bg-[var(--sale-red)]/15 text-[var(--sale-red)] hover:bg-[var(--sale-red)]/25"
                  : "bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Category Navigation - Desktop */}
      <div className="hidden md:block border-t border-[var(--divider)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-6">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className="relative"
                  onMouseEnter={() => category.hasDropdown && setActiveDropdown(category.name)}
                  onMouseLeave={() => category.hasDropdown && setActiveDropdown(null)}
                >
                  {category.hasDropdown ? (
                    <button
                      className={cn(
                        "text-sm transition-colors font-medium text-[var(--text-2)] hover:text-[var(--text)]",
                        activeDropdown === category.name && "text-[var(--text)]"
                      )}
                    >
                      {category.name}
                    </button>
                  ) : (
                    <Link
                      href={category.href}
                      className={cn(
                        "text-sm transition-colors",
                        category.isSpecial 
                          ? "font-bold text-[var(--sale-red)] hover:opacity-90" 
                          : "font-medium text-[var(--text-2)] hover:text-[var(--text)]"
                      )}
                    >
                      {category.name}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {category.hasDropdown && activeDropdown === category.name && (
                    <div className="absolute left-0 top-full pt-2 w-screen max-w-7xl -ml-4 z-50">
                      <div className="border-t shadow-lg bg-[var(--surface)] border-[var(--border)]">
                        <div className="max-w-7xl mx-auto px-8 py-8">
                          <div className="grid grid-cols-2 gap-12">
                            {/* Shop by Category Column */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--text)]">
                                Shop by category
                              </h3>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                {(category.name === 'Women' ? womenCategories : menCategories).shopByCategory.map((item) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    className="text-sm text-[var(--text-2)] hover:text-[var(--text)] transition-colors py-1.5"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                                <Link
                                  href={category.href}
                                  className="text-sm font-semibold text-[var(--text)] hover:underline py-1.5 col-span-2"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  See all {category.name.toLowerCase()}&apos;s
                                </Link>
                              </div>
                            </div>

                            {/* Featured Column */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--text)]">
                                Featured
                              </h3>
                              <div className="space-y-2">
                                {(category.name === 'Women' ? womenCategories : menCategories).featured.map((item) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    className="block text-sm text-[var(--text-2)] hover:text-[var(--text)] transition-colors py-1.5"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* View Seller Leaderboard Button - Refined Vintage Style with Popup Indicator */}
            <button
              onClick={() => setShowLeaderboardModal(true)}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium tracking-wide bg-transparent border rounded-full transition-all duration-200 group text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)] hover:border-[var(--text-2)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 focus:ring-offset-[var(--surface)]"
              aria-label="View Seller Leaderboard"
            >
              {/* Trophy Icon */}
              <svg 
                className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--text-2)] transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3H3a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236c-1.072.324-2.005.855-2.74 1.55m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c-.85.085-1.686.23-2.5.435m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c.85.085 1.686.23 2.5.435m0 0a3.75 3.75 0 01.439 5.439m-3.74-6.908a7.454 7.454 0 00.982 3.172M15.75 4.236c-1.072.324-2.005.855-2.74 1.55m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c.85.085 1.686.23 2.5.435m0 0a3.75 3.75 0 01.439 5.439m-3.74-6.908a7.454 7.454 0 01.982 3.172M9.497 11.078a7.454 7.454 0 00-.981 3.172M9.497 11.078c-.85.085-1.686.23-2.5.435" />
              </svg>
              <span className="uppercase">Seller Leaderboard</span>
              {/* Popup/Modal Indicator - Small square suggesting modal window */}
              <svg 
                className="w-2.5 h-2.5 text-[var(--text-3)] group-hover:text-[var(--text-2)] transition-colors opacity-60" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm3 1h10v2H5V5zm0 4h10v6H5V9z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <SellerLeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
      />
    </nav>
  );
}
