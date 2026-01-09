import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-20">
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-[#2D2A26] mb-8 leading-tight">
            Safety Tips
          </h1>
          
          <div className="space-y-8 text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">MEETUPS</h2>
              <p>Meet in public places during daylight hours. Bring a friend if possible.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">PAYMENT</h2>
              <p>Use secure payment methods. Avoid sharing sensitive financial information.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">COMMUNICATION</h2>
              <p>Keep all communication on Outfittr. Report suspicious behavior to support.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">ITEMS</h2>
              <p>Inspect items before completing transactions. Ask questions if anything seems unclear.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

