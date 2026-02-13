'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VintageInput } from '@/components/listings/VintageInput';

interface Step3VerificationProps {
  initial?: { legalName?: string; dob?: string; selfieUrl?: string; agreedToRules?: boolean };
  onNext: (data: { legalName: string; dob: string; selfieUrl: string; agreedToRules: boolean }) => void;
  isLoading?: boolean;
}

export default function Step3Verification({ initial, onNext, isLoading }: Step3VerificationProps) {
  const [legalName, setLegalName] = useState(initial?.legalName ?? '');
  const [dob, setDob] = useState(initial?.dob ?? '');
  const [selfieUrl, setSelfieUrl] = useState(initial?.selfieUrl ?? '');
  const [agreedToRules, setAgreedToRules] = useState(initial?.agreedToRules ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!legalName.trim()) next.legalName = 'Legal name is required';
    if (!dob.trim()) next.dob = 'Date of birth is required';
    if (!selfieUrl.trim()) next.selfieUrl = 'Selfie photo is required';
    if (!agreedToRules) next.agreedToRules = 'You must agree to the safe selling rules';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onNext({ legalName: legalName.trim(), dob: dob.trim(), selfieUrl, agreedToRules: true });
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) setSelfieUrl(data.urls[0]);
      setErrors((prev) => ({ ...prev, selfieUrl: '' }));
    } catch {
      setErrors((prev) => ({ ...prev, selfieUrl: 'Upload failed' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-[var(--text)]">Verification</h2>
      <p className="text-sm text-[var(--text-2)]">We don’t collect government ID. A few details help keep the community safe.</p>
      <VintageInput
        label="Legal name (private)"
        required
        value={legalName}
        onChange={(e) => setLegalName(e.target.value)}
        error={errors.legalName}
        placeholder="Full legal name"
      />
      <VintageInput
        label="Date of birth (private)"
        type="date"
        required
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        error={errors.dob}
      />
      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-[0.1em] font-medium text-[var(--text-2)]">
          Selfie photo <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[var(--text-3)] mb-2">A clear photo of your face. Kept private and used for trust only.</p>
        {selfieUrl ? (
          <div className="flex items-center gap-3">
            <img src={selfieUrl} alt="Selfie" className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]" />
            <div>
              <button
                type="button"
                onClick={() => setSelfieUrl('')}
                className="text-xs text-[var(--text-2)] hover:text-[var(--text)] underline"
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 border border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--surface-2)] transition-colors text-sm text-[var(--text-2)]">
            <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />
            <span>Upload selfie</span>
          </label>
        )}
        {errors.selfieUrl && <p className="text-xs text-red-600">{errors.selfieUrl}</p>}
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToRules}
          onChange={(e) => setAgreedToRules(e.target.checked)}
          className="mt-1 rounded border-[var(--border)]"
        />
        <span className="text-sm text-[var(--text)]">
          I agree to follow safe selling rules and not list counterfeit items.
        </span>
      </label>
      {errors.agreedToRules && <p className="text-xs text-red-600">{errors.agreedToRules}</p>}
      <div className="pt-4 sticky bottom-4 sm:relative sm:bottom-0">
        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full sm:w-auto">
          Save and continue
        </Button>
      </div>
    </form>
  );
}
