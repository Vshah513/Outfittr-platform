import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-20">
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-[#2D2A26] mb-8 leading-tight">
            Help Center
          </h1>
          
          <div className="space-y-8 text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">FOR BUYERS</h2>
              <p>Browse items, message sellers, and arrange delivery or meetups directly with sellers.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">FOR SELLERS</h2>
              <p>List items from your seller dashboard. Set prices, upload photos, and manage your inventory.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">NEED MORE HELP?</h2>
              <p>Contact us at support@outfittr.com</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

