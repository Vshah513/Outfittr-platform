export default function PaymentsDelivery() {
  const bullets = [
    'Outfittr connects buyers and sellers in Nairobi.',
    'Buyers pay sellers directly (usually via M-Pesa).',
    'Meetup or local delivery is arranged in chat.',
    'Rate and review after the transaction.',
  ];

  return (
    <section className="py-16 md:py-20 bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-editorial text-3xl md:text-4xl font-medium tracking-tight text-[var(--text)]">
            How payments &amp; delivery work
          </h2>
          <p className="text-base text-[var(--text-2)] mt-2">(Nairobi today)</p>
        </div>

        <ul className="space-y-4 max-w-xl mx-auto">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              <span className="text-base text-[var(--text)] leading-relaxed">
                {bullet}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-[var(--text-2)] italic text-center mt-8">
          Kenya-wide expansion coming soon.
        </p>
      </div>
    </section>
  );
}
