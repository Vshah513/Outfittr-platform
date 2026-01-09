import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-20">
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-[#2D2A26] mb-8 leading-tight">
            Terms of Service
          </h1>
          
          <div className="space-y-6 text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
            <p className="text-sm text-[#6B6560]">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <p>
              By using Outfittr, you agree to these Terms of Service. Outfittr is a marketplace platform connecting buyers and sellers of secondhand fashion items. We facilitate connections but do not directly handle transactions or payments between users.
            </p>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">1. ACCEPTANCE OF TERMS</h2>
              <p>By accessing or using Outfittr, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">2. SELLER RESPONSIBILITIES</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and truthful descriptions of items, including condition, size, brand, and any defects</li>
                <li>Upload clear, representative photos of items</li>
                <li>Set fair and reasonable prices</li>
                <li>Respond promptly to buyer inquiries</li>
                <li>Complete transactions as agreed with buyers</li>
                <li>Handle delivery or meetup arrangements responsibly</li>
                <li>Do not list prohibited items (counterfeit goods, illegal items, etc.)</li>
              </ul>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">3. BUYER RESPONSIBILITIES</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Review listings carefully before purchasing</li>
                <li>Ask questions to sellers if you need clarification</li>
                <li>Complete payment as agreed</li>
                <li>Provide accurate delivery information or meetup details</li>
                <li>Inspect items upon receipt and report issues promptly</li>
              </ul>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">4. PROHIBITED ITEMS</h2>
              <p>You may not list or sell: counterfeit goods, stolen items, weapons, illegal substances, or any items that violate local laws or regulations.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">5. PAYMENTS AND TRANSACTIONS</h2>
              <p>Outfittr facilitates connections but does not process payments directly. Buyers and sellers are responsible for arranging payment methods. We recommend using secure payment methods and exercising caution in all transactions.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">6. DISPUTE RESOLUTION</h2>
              <p>In case of disputes between buyers and sellers, we encourage parties to communicate directly. Outfittr may assist in dispute resolution but is not liable for transaction outcomes.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">7. LIMITATION OF LIABILITY</h2>
              <p>Outfittr is provided "as is" without warranties. We are not liable for any damages arising from use of the platform, including but not limited to transaction disputes, item quality issues, or delivery problems.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">8. INTELLECTUAL PROPERTY</h2>
              <p>All content on Outfittr, including logos, designs, and text, is the property of Outfittr or its licensors. Users retain ownership of their listing content but grant Outfittr a license to display it on the platform.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">9. ACCOUNT TERMINATION</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or harm the platform community.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">10. CHANGES TO TERMS</h2>
              <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <p className="text-sm text-[#6B6560]">
              For questions about these terms, contact us at legal@outfittr.com
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

