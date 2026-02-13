'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VintageSelect } from '@/components/listings/VintageSelect';
import { VintageInput } from '@/components/listings/VintageInput';
import { NAIROBI_AREAS } from '@/lib/locations';

interface Step2LocationProps {
  initial?: { nairobiArea?: string; meetupZones?: string[]; deliveryPreference?: string; deliveryFeeRange?: string };
  onNext: (data: {
    nairobiArea: string;
    meetupZones: string[];
    deliveryPreference: 'pickup' | 'delivery' | 'both';
    deliveryFeeRange?: string;
  }) => void;
  isLoading?: boolean;
}

export default function Step2Location({ initial, onNext, isLoading }: Step2LocationProps) {
  const [nairobiArea, setNairobiArea] = useState(initial?.nairobiArea ?? '');
  const [meetupZones, setMeetupZones] = useState<string[]>(initial?.meetupZones ?? []);
  const [deliveryPreference, setDeliveryPreference] = useState<'pickup' | 'delivery' | 'both'>(
    (initial?.deliveryPreference as 'pickup' | 'delivery' | 'both') ?? 'both'
  );
  const [deliveryFeeRange, setDeliveryFeeRange] = useState(initial?.deliveryFeeRange ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleZone = (zone: string) => {
    setMeetupZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!nairobiArea.trim()) next.nairobiArea = 'Nairobi area is required';
    if (meetupZones.length === 0) next.meetupZones = 'Select at least one meetup zone';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onNext({
      nairobiArea: nairobiArea.trim(),
      meetupZones,
      deliveryPreference,
      deliveryFeeRange: deliveryFeeRange.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-[var(--text)]">Location & handover</h2>
      <VintageSelect
        label="Nairobi area"
        required
        value={nairobiArea}
        onChange={(e) => setNairobiArea(e.target.value)}
        error={errors.nairobiArea}
        options={[{ value: '', label: 'Select area' }, ...NAIROBI_AREAS.map((a) => ({ value: a, label: a }))]}
      />
      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--text-2)]">
          Preferred meetup zones <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[var(--text-3)] mb-2">Select at least one. Buyers can meet you in these areas.</p>
        <div className="max-h-48 overflow-y-auto border border-[var(--border)] rounded-lg p-3 space-y-2 bg-[var(--surface)]">
          {NAIROBI_AREAS.map((zone) => (
            <label key={zone} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={meetupZones.includes(zone)}
                onChange={() => toggleZone(zone)}
                className="rounded border-[var(--border)]"
              />
              <span className="text-sm text-[var(--text)]">{zone}</span>
            </label>
          ))}
        </div>
        {errors.meetupZones && <p className="text-xs text-red-600">{errors.meetupZones}</p>}
      </div>
      <VintageSelect
        label="Delivery preference"
        required
        value={deliveryPreference}
        onChange={(e) => setDeliveryPreference(e.target.value as 'pickup' | 'delivery' | 'both')}
        options={[
          { value: 'pickup', label: 'Pickup only' },
          { value: 'delivery', label: 'Delivery only' },
          { value: 'both', label: 'Both pickup and delivery' },
        ]}
      />
      <VintageInput
        label="Delivery fee range (optional)"
        value={deliveryFeeRange}
        onChange={(e) => setDeliveryFeeRange(e.target.value)}
        placeholder="e.g. KES 100–200"
      />
      <div className="pt-4 sticky bottom-4 sm:relative sm:bottom-0">
        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full sm:w-auto">
          Save and continue
        </Button>
      </div>
    </form>
  );
}
