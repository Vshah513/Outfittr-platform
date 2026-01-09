'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  const handleSellClick = () => {
    if (!user) {
      openAuthModal('/listings/new', { type: 'sell' }, 'signup');
    } else {
      router.push('/listings/new');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Headline */}
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-2">
              Nothing new. Everything worth wearing.
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600">
              Secondhand and vintage. New finds daily.
            </p>
          </div>

          {/* Three Collection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Collections Card */}
            <Link 
              href="/marketplace"
              className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
            >
              {/* Background Image */}
              <Image 
                src="/collections/collections-hero.jpg"
                alt="Collections"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Text Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide">
                  Collections
                </h2>
              </div>
            </Link>

            {/* New Arrivals Card */}
            <Link 
              href="/marketplace?tab=new"
              className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
            >
              {/* Background Image */}
              <Image 
                src="/collections/New collections-hero.jpg"
                alt="New Arrivals"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Text Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide">
                  New Arrivals
                </h2>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Section Break */}
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Subtle divider line */}
          <div className="w-full h-px bg-gray-200 mb-8"></div>
          
          {/* Editorial Label */}
          <div className="text-center mb-10 md:mb-12">
            <p className="text-xs md:text-sm text-gray-500 tracking-[0.25em] uppercase">
              Browse by Category
            </p>
          </div>
        </div>
      </div>

      {/* Shop by Gender Section */}
      <section className="relative">
        <div className="grid md:grid-cols-2">
          {/* Women's Section */}
          <Link 
            href="/category/women"
            className="relative group overflow-hidden"
          >
            <div className="aspect-[3/4] md:aspect-[9/16] lg:aspect-[2/3] relative">
              <Image
                src="/collections/Woman.jpg"
                alt="Women's Fashion"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">Women</h2>
                <span className="px-8 py-3 bg-white text-black font-semibold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors">
                  Shop now
                </span>
              </div>
            </div>
          </Link>

          {/* Men's Section */}
          <Link 
            href="/category/men"
            className="relative group overflow-hidden"
          >
            <div className="aspect-[3/4] md:aspect-[9/16] lg:aspect-[2/3] relative">
              <Image
                src="/collections/Man.jpg"
                alt="Men's Fashion"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">Men</h2>
                <span className="px-8 py-3 bg-white text-black font-semibold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors">
                  Shop now
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Selling CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 leading-tight">
            Shop for less. Sell with ease. Keep fashion circular.
          </h2>
          <Button
            onClick={handleSellClick}
            variant="primary"
            size="lg"
            className="px-12"
          >
            Sell now
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            *Payment processing fees may apply. <Link href="/help/fees" className="underline hover:text-gray-700">Learn more</Link>.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600">Simple steps to buy and sell</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Browse & Discover</h3>
              <p className="text-gray-600">
                Explore thousands of unique items from sellers across Kenya
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Connect & Chat</h3>
              <p className="text-gray-600">
                Message sellers directly to ask questions or negotiate
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Buy or Sell</h3>
              <p className="text-gray-600">
                Complete transactions safely with buyer protection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Start buying or selling unique fashion items today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => openAuthModal(undefined, undefined, 'signup')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto bg-white text-black hover:bg-gray-100"
            >
              Get Started
            </Button>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-black">
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

