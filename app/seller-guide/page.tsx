import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SellerGuidePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-20">
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-[#2D2A26] mb-8 leading-tight">
            Seller Guide
          </h1>
          
          <div className="space-y-8 text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">PHOTOS</h2>
              <p>Take clear, well-lit photos. Show the item from multiple angles and include any flaws or wear.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">DESCRIPTIONS</h2>
              <p>Be honest about condition, size, and brand. Include measurements when helpful.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">PRICING</h2>
              <p>Set fair prices based on condition and original value. Buyers appreciate transparency.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">DELIVERY</h2>
              <p>Arrange delivery or meetups with buyers. Communicate clearly about timing and location.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

