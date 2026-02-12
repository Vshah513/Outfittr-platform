'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export default function SellInMinutes() {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  const handleSellClick = () => {
    if (!user) {
      openAuthModal('/listings/new', { type: 'sell' }, 'signup');
    } else {
      router.push('/listings/new');
    }
  };

  const steps = [
    {
      number: 1,
      title: 'List your item',
      description: 'Upload photos and set a price.',
    },
    {
      number: 2,
      title: 'Connect',
      description: 'Chat and agree on delivery.',
    },
    {
      number: 3,
      title: 'Get paid',
      description: 'Receive payment via M-Pesa.',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-editorial text-3xl md:text-4xl font-medium tracking-tight text-[var(--text)]">
            Sell in minutes.
          </h2>
          <p className="text-lg text-[var(--text-2)] mt-3 max-w-lg mx-auto">
            List your item, connect with buyers, and get paid via M-Pesa.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Dashed connector line — desktop only */}
          <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-px border-t-2 border-dashed border-[var(--border)]" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {steps.map((step) => (
              <div key={step.number} className="text-center relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 bg-[var(--text)] text-[var(--bg)] relative z-10">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-1.5 text-[var(--text)]">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Button onClick={handleSellClick} variant="primary" size="lg" className="px-10">
            List an item
          </Button>
        </div>
      </div>
    </section>
  );
}
