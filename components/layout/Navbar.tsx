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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
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
      setShowProfileMenu(!showProfileMenu);
    } else {
      router.push('/login');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowProfileMenu(false);
    router.push('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
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

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Right Side Actions - Vintage Editorial Utility Row */}
          <div className="flex items-center gap-5">
            {/* Sell Button - Prominent pill */}
            <button
              onClick={handleSellClick}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium tracking-wide uppercase bg-[#F5F1E8] border border-[#D4C4B0] text-[#4A4540] rounded-full transition-all duration-200 hover:bg-[#EDE6D9] hover:border-[#8C8680] hover:text-[#2D2926] active:bg-[#E5DDD0] focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] focus:ring-offset-1 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span>Sell</span>
            </button>

            {/* Profile - Prominent circular avatar/icon */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={handleProfileClick}
                className="p-2 rounded-full border border-[#D4C4B0] bg-[#FAF9F7] text-[#4A4540] transition-all duration-200 hover:bg-[#F5F1E8] hover:border-[#8C8680] hover:text-[#2D2926] focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] focus:ring-offset-1 shadow-sm"
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

            {/* Sign in - Quiet Text Link (only when logged out) */}
            {!user && (
              <button
                onClick={() => openAuthModal(undefined, undefined, 'signin')}
                className="hidden md:block text-xs font-medium tracking-wide uppercase text-[#8C8680] hover:text-[#4A4540] transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] focus:ring-offset-1 rounded px-1"
              >
                Sign in
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation - Desktop */}
      <div className="hidden md:block border-t border-gray-100">
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
                        "text-sm transition-colors font-medium hover:text-gray-600",
                        activeDropdown === category.name && "text-black"
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
                          ? "font-bold text-red-600 hover:text-red-700" 
                          : "font-medium hover:text-gray-600"
                      )}
                    >
                      {category.name}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {category.hasDropdown && activeDropdown === category.name && (
                    <div className="absolute left-0 top-full pt-2 w-screen max-w-7xl -ml-4 z-50">
                      <div className="bg-white border-t border-gray-200 shadow-lg">
                        <div className="max-w-7xl mx-auto px-8 py-8">
                          <div className="grid grid-cols-2 gap-12">
                            {/* Shop by Category Column */}
                            <div>
                              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
                                Shop by category
                              </h3>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                {(category.name === 'Women' ? womenCategories : menCategories).shopByCategory.map((item) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    className="text-sm text-gray-700 hover:text-black transition-colors py-1.5"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                                <Link
                                  href={category.href}
                                  className="text-sm font-semibold text-black hover:underline py-1.5 col-span-2"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  See all {category.name.toLowerCase()}&apos;s
                                </Link>
                              </div>
                            </div>

                            {/* Featured Column */}
                            <div>
                              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
                                Featured
                              </h3>
                              <div className="space-y-2">
                                {(category.name === 'Women' ? womenCategories : menCategories).featured.map((item) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    className="block text-sm text-gray-700 hover:text-black transition-colors py-1.5"
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
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#6B6560] bg-transparent border border-[#D4C4B0] rounded-full transition-all duration-200 hover:bg-[#FAF9F7] hover:border-[#8C8680] hover:text-[#4A4540] active:bg-[#F5F1E8] focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] focus:ring-offset-1 group"
              aria-label="View Seller Leaderboard"
            >
              {/* Trophy Icon */}
              <svg 
                className="w-4 h-4 text-[#8C8680] group-hover:text-[#6B6560] transition-colors" 
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
                className="w-2.5 h-2.5 text-[#8C8680] group-hover:text-[#6B6560] transition-colors opacity-60" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm3 1h10v2H5V5zm0 4h10v6H5V9z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
              />
            </form>

            {/* Mobile Categories */}
            <div className="space-y-2">
              {/* Mobile Leaderboard Button */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowLeaderboardModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-transparent border border-[#D4C4B0] text-[#6B6560] rounded-lg font-medium text-sm hover:bg-[#FAF9F7] hover:border-[#8C8680] hover:text-[#4A4540] transition-all group"
              >
                <svg 
                  className="w-5 h-5 text-[#8C8680] group-hover:text-[#6B6560] transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3H3a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236c-1.072.324-2.005.855-2.74 1.55m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c-.85.085-1.686.23-2.5.435m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c.85.085 1.686.23 2.5.435m0 0a3.75 3.75 0 01.439 5.439m-3.74-6.908a7.454 7.454 0 00.982 3.172M15.75 4.236c-1.072.324-2.005.855-2.74 1.55m0 0a3.75 3.75 0 00.439 5.439m3.301-6.908c.85.085 1.686.23 2.5.435m0 0a3.75 3.75 0 01.439 5.439m-3.74-6.908a7.454 7.454 0 01.982 3.172M9.497 11.078a7.454 7.454 0 00-.981 3.172M9.497 11.078c-.85.085-1.686.23-2.5.435" />
                </svg>
                <span>Seller Leaderboard</span>
                <svg 
                  className="w-3 h-3 text-[#8C8680] group-hover:text-[#6B6560] transition-colors opacity-60" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm3 1h10v2H5V5zm0 4h10v6H5V9z" />
                </svg>
              </button>
              
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className={cn(
                    "block py-2 text-sm",
                    category.isSpecial 
                      ? "font-bold text-red-600" 
                      : "font-medium hover:text-gray-600"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {/* Mobile Sell Button */}
            <button
              onClick={() => {
                handleSellClick();
                setIsMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 w-full py-3 bg-black text-white rounded-full font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Sell an item</span>
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <SellerLeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
      />
    </nav>
  );
}
