'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import SwipeDiscovery from '@/components/swipe/SwipeDiscovery';
import ScrollHintCue from '@/components/home/ScrollHintCue';

export default function HomePage() {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();
  const menTileRef = useRef<HTMLDivElement>(null);

  const handleSellClick = () => {
    if (!user) {
      openAuthModal('/listings/new', { type: 'sell' }, 'signup');
    } else {
      router.push('/listings/new');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-8 pb-8 bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4">
          {/* Shop by Gender - centered (larger tiles on mobile) */}
          <div className="relative max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
            <Link
              href="/category/women"
              className="relative group overflow-hidden rounded-xl block w-full"
            >
              <div className="relative w-full h-[280px] md:h-auto md:aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src="/collections/Woman.jpg"
                  alt="Women's Fashion"
                  fill
                  sizes="(max-width: 768px) 50vw, 400px"
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Women</h2>
                  <span className="px-6 py-2.5 bg-white text-black font-semibold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors rounded-full">
                    Shop now
                  </span>
                </div>
              </div>
            </Link>
            <div ref={menTileRef} className="block w-full">
              <Link
                href="/category/men"
                className="relative group overflow-hidden rounded-xl block w-full"
              >
                <div className="relative w-full h-[280px] md:h-auto md:aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src="/collections/Man.jpg"
                    alt="Men's Fashion"
                    fill
                    sizes="(max-width: 768px) 50vw, 400px"
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Men</h2>
                    <span className="px-6 py-2.5 bg-white text-black font-semibold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors rounded-full">
                      Shop now
                    </span>
                  </div>
                </div>
              </Link>
            </div>
            </div>
          </div>
          <ScrollHintCue menTileRef={menTileRef} />
        </div>
      </section>

      {/* Selling CTA - Thrift smarter. Sell faster. */}
      <section className="py-16 bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 leading-tight text-[var(--text)]">
            Thrift smarter. Sell faster.
          </h2>
          <Button
            onClick={handleSellClick}
            variant="primary"
            size="lg"
            className="px-12"
          >
            Sell now
          </Button>
          <p className="text-sm text-[var(--text-2)] mt-4">
            *Payment processing fees may apply. <Link href="/help/fees" className="underline hover:text-[var(--text)] text-[var(--link)]">Learn more</Link>.
          </p>
        </div>
      </section>

      {/* Swipe Discovery */}
      <section className="pt-8 pb-20 bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4">
          <SwipeDiscovery />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-[var(--bg-2)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text)]">How It Works</h2>
            <p className="text-[var(--text-2)]">Simple steps to buy and sell</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 bg-[var(--text)] text-[var(--bg)]">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Browse & Discover</h3>
              <p className="text-[var(--text-2)]">
                Explore thousands of unique items from sellers across Kenya
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 bg-[var(--text)] text-[var(--bg)]">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Buy or Sell</h3>
              <p className="text-[var(--text-2)]">
                Complete transactions safely with buyer protection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 bg-[var(--text)] text-[var(--bg)]">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Deliver & Get Paid</h3>
              <p className="text-[var(--text-2)]">
                Confirm delivery and get paid fast and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - inverted accent */}
      <section className="py-16 bg-[var(--text)] text-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-[var(--bg)]/80 text-lg mb-8">
            Start buying or selling unique fashion items today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => openAuthModal(undefined, undefined, 'signup')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto bg-[var(--bg)] text-[var(--text)] hover:opacity-90"
            >
              Get Started
            </Button>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-[var(--bg)] text-[var(--bg)] hover:bg-[var(--bg)] hover:text-[var(--text)]">
                Browse Items
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

