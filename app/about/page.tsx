import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Block */}
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-12">
          {/* Small line above title */}
          <p className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-6 font-medium">
            EST. 2026 • NAIROBI, KENYA
          </p>
          
          {/* Title */}
          <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl font-medium text-[#2D2A26] mb-8 leading-tight tracking-tight">
            About Outfittr
          </h1>
          
          {/* Intro */}
          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-16 max-w-2xl" style={{ lineHeight: '1.75' }}>
            Outfittr is a marketplace where people in Kenya can buy and sell secondhand clothing.
          </p>
        </section>

        {/* Divider with ornament */}
        <div className="max-w-3xl mx-auto px-6 md:px-8 mb-16">
          <div className="flex items-center justify-center gap-3">
            <div className="flex-1 h-px bg-[#E0DCD4]"></div>
            <span className="text-[#8C8680] text-sm">•</span>
            <div className="flex-1 h-px bg-[#E0DCD4]"></div>
          </div>
        </div>

        {/* Main Content Sections */}
        <section className="max-w-3xl mx-auto px-6 md:px-8 pb-12">
          {/* First paragraph */}
          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-12" style={{ lineHeight: '1.75' }}>
            Sellers create an account, list items, set prices, and manage their listings from a seller dashboard. Buyers browse items, follow sellers they like, and come back for new drops from those accounts.
          </p>

          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-12" style={{ lineHeight: '1.75' }}>
            Outfittr is built to make browsing feel simple and organised. Listings are photo-led, and items are grouped by category and size to reduce noise.
          </p>

          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-16" style={{ lineHeight: '1.75' }}>
            Each transaction happens between a buyer and a seller. Sellers handle delivery or meetups, and buyers can rate sellers after an order.
          </p>

          {/* Thin divider */}
          <div className="w-full h-px bg-[#E0DCD4] mb-16"></div>

          {/* How it works section */}
          <div className="mb-16">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-6 font-medium">
              HOW IT WORKS
            </h2>
            <ul className="space-y-3 text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
              <li>• Sellers list items with photos, descriptions, and prices</li>
              <li>• Buyers browse, save favorites, and message sellers directly</li>
              <li>• Transactions are arranged between buyer and seller</li>
            </ul>
          </div>

          {/* Thin divider */}
          <div className="w-full h-px bg-[#E0DCD4] mb-16"></div>

          {/* What we expect section */}
          <div className="mb-20">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-6 font-medium">
              WHAT WE EXPECT FROM SELLERS
            </h2>
            <p className="text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
              Clear photos, honest condition descriptions, and responsibility for delivery or meetup arrangements.
            </p>
          </div>

          {/* Divider with ornament */}
          <div className="mb-16">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-1 h-px bg-[#E0DCD4]"></div>
              <span className="text-[#8C8680] text-sm">— • —</span>
              <div className="flex-1 h-px bg-[#E0DCD4]"></div>
            </div>
          </div>

          {/* Closing statement */}
          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-20 text-center italic" style={{ lineHeight: '1.75' }}>
            Outfittr exists to help people keep clothes in use longer by making resale straightforward: list what you don't wear, buy what you will, then repeat.
          </p>

          {/* Thin divider */}
          <div className="w-full h-px bg-[#E0DCD4] mb-12"></div>

          {/* Footnote */}
          <p className="text-sm text-[#6B6560] leading-relaxed text-center" style={{ lineHeight: '1.75' }}>
            Outfittr is seller-to-buyer. Delivery is arranged by the seller.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

