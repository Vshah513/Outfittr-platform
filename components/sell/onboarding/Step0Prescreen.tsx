'use client';

import { Button } from '@/components/ui/Button';

interface Step0PrescreenProps {
  onContinue: () => void;
}

export default function Step0Prescreen({ onContinue }: Step0PrescreenProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[var(--text)]">Start selling</h2>
      <ul className="space-y-2 text-sm text-[var(--text-2)] list-disc list-inside">
        <li>List in minutes</li>
        <li>Get paid via M-Pesa</li>
        <li>Nairobi-first</li>
      </ul>
      <p className="text-sm text-[var(--text-3)] italic">Buyers pay sellers directly. Transact safely.</p>
      <div className="pt-4">
        <Button variant="primary" onClick={onContinue} className="w-full sm:w-auto">
          Continue
        </Button>
      </div>
    </div>
  );
}
