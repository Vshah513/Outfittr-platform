import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-20">
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-[#2D2A26] mb-8 leading-tight">
            Privacy Policy
          </h1>
          
          <div className="space-y-6 text-base text-[#2D2A26] leading-relaxed" style={{ lineHeight: '1.75' }}>
            <p className="text-sm text-[#6B6560]">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <p>
              We respect your privacy. This Privacy Policy explains how Outfittr collects, uses, and protects your information when you use our marketplace platform.
            </p>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">1. INFORMATION WE COLLECT</h2>
              <p className="mb-2">We collect information you provide directly:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email, phone number, username, display name, profile photo</li>
                <li><strong>Listing Information:</strong> Product descriptions, photos, prices, location</li>
                <li><strong>Payment Information:</strong> Processed securely through third-party providers (Paystack)</li>
              </ul>
              <p className="mt-4 mb-2">We automatically collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usage data and analytics</li>
                <li>Device information and IP address</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">2. HOW WE USE YOUR INFORMATION</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Facilitate transactions between buyers and sellers</li>
                <li>Display your listings and profile to other users</li>
                <li>Enable messaging between users</li>
                <li>Process payments and subscriptions</li>
                <li>Send important account and transaction notifications</li>
                <li>Improve our platform and user experience</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">3. THIRD-PARTY SERVICES</h2>
              <p>We use trusted third-party services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Paystack:</strong> Payment processing</li>
                <li><strong>Vercel:</strong> Hosting and analytics</li>
                <li><strong>Africa's Talking:</strong> SMS services (if enabled)</li>
              </ul>
              <p className="mt-4">These services have their own privacy policies governing data handling.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">4. DATA RETENTION</h2>
              <p>We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your account and data at any time.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">5. YOUR RIGHTS</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Access your personal information</li>
                <li>Update or correct your information</li>
                <li>Delete your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your data</li>
              </ul>
              <p className="mt-4">To exercise these rights, contact us at privacy@outfittr.com</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">6. COOKIES</h2>
              <p>We use cookies and similar technologies to enhance your experience, analyze usage, and remember your preferences. You can control cookies through your browser settings.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">7. DATA SECURITY</h2>
              <p>We implement security measures to protect your information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">8. CHILDREN'S PRIVACY</h2>
              <p>Outfittr is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-medium">9. CHANGES TO THIS POLICY</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.</p>
            </div>
            
            <div className="w-full h-px bg-[#E0DCD4]"></div>
            
            <p className="text-sm text-[#6B6560]">
              For questions about this Privacy Policy, contact us at privacy@outfittr.com
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

