'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'Where do you operate right now?',
    answer: 'Currently Nairobi. Kenya-wide is coming next.',
  },
  {
    question: 'How do sellers get paid?',
    answer: 'Buyers pay sellers directly, usually via M-Pesa.',
  },
  {
    question: "What if an item isn't as described?",
    answer:
      'Use ratings, request extra photos, and report bad actors. We remove repeat offenders.',
  },
  {
    question: 'How does delivery work in Nairobi?',
    answer: 'You can meet up or arrange delivery. Details are agreed in chat.',
  },
  {
    question: 'Are there any fees?',
    answer: 'Payment processing fees may apply depending on method.',
  },
];

export default function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-20 bg-[var(--surface)]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-editorial text-3xl md:text-4xl font-medium tracking-tight text-[var(--text)]">
            FAQ
          </h2>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {faqs.map((faq, index) => (
            <div key={index}>
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between py-5 text-left gap-4 group"
              >
                <span className="text-base font-medium text-[var(--text)] group-hover:text-[var(--text-2)] transition-colors">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 text-[var(--text-2)] transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm text-[var(--text-2)] leading-relaxed pr-10">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
