'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VintageInput } from '@/components/listings/VintageInput';

interface Step1BasicsProps {
  initial?: { displayName?: string; email?: string; mpesaNumber?: string; profilePhotoUrl?: string };
  userEmail?: string;
  onNext: (data: { displayName: string; email: string; mpesaNumber: string; profilePhotoUrl?: string }) => void;
  isLoading?: boolean;
}

export default function Step1Basics({ initial, userEmail, onNext, isLoading }: Step1BasicsProps) {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [email, setEmail] = useState(initial?.email ?? userEmail ?? '');
  const [mpesaNumber, setMpesaNumber] = useState(initial?.mpesaNumber ?? '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(initial?.profilePhotoUrl ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = 'Display name is required';
    const emailTrim = email.trim();
    if (!emailTrim) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) next.email = 'Enter a valid email';
    const mpesa = mpesaNumber.replace(/\s/g, '');
    if (!mpesa) next.mpesaNumber = 'M-Pesa number is required';
    else if (!/^(\+?254|0)[17]\d{8}$/.test(mpesa)) next.mpesaNumber = 'Enter a valid M-Pesa number (e.g. 07XX or +2547XX)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onNext({
      displayName: displayName.trim(),
      email: email.trim(),
      mpesaNumber: mpesaNumber.trim(),
      profilePhotoUrl: profilePhotoUrl.trim() || undefined,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) setProfilePhotoUrl(data.urls[0]);
    } catch {
      setErrors((prev) => ({ ...prev, profilePhoto: 'Upload failed' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-[var(--text)]">Seller basics</h2>
      <VintageInput
        label="Display name (public)"
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={errors.displayName}
        placeholder="How buyers will see you"
      />
      <VintageInput
        label="Email (private)"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="your@email.com"
      />
      <VintageInput
        label="M-Pesa number (private)"
        required
        value={mpesaNumber}
        onChange={(e) => setMpesaNumber(e.target.value)}
        error={errors.mpesaNumber}
        helperText="e.g. 0712345678 or +254712345678"
        placeholder="07XX XXX XXX"
      />
      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--text-2)]">
          Profile photo (optional)
        </label>
        {profilePhotoUrl ? (
          <div className="flex items-center gap-3">
            <img src={profilePhotoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-[var(--border)]" />
            <div>
              <button
                type="button"
                onClick={() => setProfilePhotoUrl('')}
                className="text-xs text-[var(--text-2)] hover:text-[var(--text)] underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--surface-2)] transition-colors text-sm text-[var(--text-2)]">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <span>Upload photo</span>
          </label>
        )}
        {errors.profilePhoto && <p className="text-xs text-red-600">{errors.profilePhoto}</p>}
      </div>
      <div className="pt-4 sticky bottom-4 sm:relative sm:bottom-0">
        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full sm:w-auto">
          Save and continue
        </Button>
      </div>
    </form>
  );
}
