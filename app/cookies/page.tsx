import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-20">
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-[#2D2A26] mb-8 leading-tight">
            Cookie Policy
          </h1>
          
          <div className="space-y-6 text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
            <p>
              Outfittr uses cookies to improve your experience, remember your preferences, and analyze site usage.
            </p>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">ESSENTIAL COOKIES</h2>
              <p>Required for the site to function, including authentication and security.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">ANALYTICS</h2>
              <p>Help us understand how visitors use Outfittr to improve the platform.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <p className="text-sm text-[#6B6560]">
              You can manage cookie preferences in your browser settings.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

