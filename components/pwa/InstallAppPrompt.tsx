'use client';

import { useState, useEffect } from 'react';

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = (window as Window & { standalone?: boolean }).standalone ?? window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone || !deferredPrompt) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="text-sm font-medium text-[var(--text)] mb-1">Install Outfittr</p>
      <p className="text-xs text-[var(--text-2)] mb-3">Add to your home screen for quick access and a full app experience.</p>
      <button
        type="button"
        onClick={handleInstall}
        className="text-sm font-medium px-4 py-2 rounded-full bg-[var(--text)] text-[var(--bg)] hover:opacity-90"
      >
        Install app
      </button>
    </div>
  );
}
