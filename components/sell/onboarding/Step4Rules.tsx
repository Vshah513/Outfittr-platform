'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Step4RulesProps {
  onSubmit: (rules: {
    photosActualItem: boolean;
    discloseDefects: boolean;
    noCounterfeit: boolean;
    noSuspiciousDeposits: boolean;
  }) => void;
  isLoading?: boolean;
}

const RULES = [
  { key: 'photosActualItem' as const, text: 'Photos are of the actual item' },
  { key: 'discloseDefects' as const, text: 'I will disclose defects honestly' },
  { key: 'noCounterfeit' as const, text: 'No counterfeit items' },
  { key: 'noSuspiciousDeposits' as const, text: "I won't request deposits in suspicious ways" },
];

export default function Step4Rules({ onSubmit, isLoading }: Step4RulesProps) {
  const [rules, setRules] = useState({
    photosActualItem: false,
    discloseDefects: false,
    noCounterfeit: false,
    noSuspiciousDeposits: false,
  });
  const [error, setError] = useState('');

  const handleToggle = (key: keyof typeof rules) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allChecked = RULES.every((r) => rules[r.key]);
    if (!allChecked) {
      setError('You must agree to all rules to activate.');
      return;
    }
    onSubmit(rules);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-[var(--text)]">Selling rules</h2>
      <p className="text-sm text-[var(--text-2)]">By activating, you agree to the following:</p>
      <div className="space-y-3">
        {RULES.map(({ key, text }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules[key]}
              onChange={() => handleToggle(key)}
              className="mt-1 rounded border-[var(--border)]"
            />
            <span className="text-sm text-[var(--text)]">{text}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="pt-4 sticky bottom-4 sm:relative sm:bottom-0">
        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full sm:w-auto">
          Activate seller account
        </Button>
      </div>
    </form>
  );
}
