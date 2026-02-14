'use client';

import { useState, useEffect } from 'react';

/**
 * QR code that encodes the app URL. When scanned, opens the PWA so the user can add to home screen.
 * Uses a public QR API (no API key). Size and URL are configurable.
 */
export default function AddToHomeScreenQR({
  size = 160,
  label = 'Add to home screen',
  className = '',
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  const [appUrl, setAppUrl] = useState<string>('');

  useEffect(() => {
    setAppUrl(
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'https://outfittr-platform.vercel.app'
    );
  }, []);

  if (!appUrl) return null;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(appUrl)}&margin=8`;

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <img
        src={qrSrc}
        alt="QR code: scan to open Outfittr and add to home screen"
        width={size}
        height={size}
        className="rounded-lg border border-[var(--border)] bg-white p-1"
      />
      <p className="mt-2 text-xs font-medium text-[var(--text-2)] max-w-[140px]">
        {label}
      </p>
      <p className="mt-0.5 text-[10px] text-[var(--text-3)]">
        Scan with your phone
      </p>
    </div>
  );
}
