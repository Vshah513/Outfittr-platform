'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const SESSION_KEY = 'outfittr-scroll-hint-dismissed';
const SCROLL_THRESHOLD_PX = 30;
const FADE_OUT_MS = 300;
const DIM_AFTER_MS = 7000;
const COPY_SWAP_AFTER_MS = 1500;
const TRACKPAD_HINT_DURATION_MS = 2000;
const INTENT_PAUSE_MS = 2000;
const FOLD_PROXIMITY_PX = 280;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function ScrollHintPeek() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start true until we check session
  const [opacity, setOpacity] = useState(1);
  const [copyPhase, setCopyPhase] = useState<'scroll' | 'sell' | 'trackpad' | 'swipe'>('scroll');
  const [emphasize, setEmphasize] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const scrollHandled = useRef(false);
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copySwapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackpadHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef(0);
  const lastMouseYRef = useRef(0);
  const intentTriggeredRef = useRef(false);
  const isMobile = useIsMobile();

  // One-time per session: don't show if already dismissed
  useEffect(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
        setDismissed(true);
        return;
      }
      setDismissed(false);
    } finally {
      setMounted(true);
    }
  }, []);

  // Copy: start as "Scroll for more" (or "Swipe up" on mobile), then after 1.5s switch to "Sell your items ↓" once
  useEffect(() => {
    if (!mounted || dismissed) return;
    copySwapTimer.current = setTimeout(() => {
      setCopyPhase('sell');
    }, COPY_SWAP_AFTER_MS);
    return () => {
      if (copySwapTimer.current) clearTimeout(copySwapTimer.current);
    };
  }, [mounted, dismissed]);

  // Auto-dim after 6–8s
  useEffect(() => {
    if (!mounted || dismissed) return;
    dimTimer.current = setTimeout(() => {
      setOpacity(0.2);
    }, DIM_AFTER_MS);
    return () => {
      if (dimTimer.current) clearTimeout(dimTimer.current);
    };
  }, [mounted, dismissed]);

  // Scroll dismiss: first scroll > 30px → fade out, sessionStorage, remove
  const handleScroll = useCallback(() => {
    if (scrollHandled.current || dismissed) return;
    if (typeof window === 'undefined') return;
    if (window.scrollY >= SCROLL_THRESHOLD_PX) {
      scrollHandled.current = true;
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch (_) {}
      setOpacity(0);
      setTimeout(() => setDismissed(true), FADE_OUT_MS);
    }
  }, [dismissed]);

  useEffect(() => {
    if (!mounted || dismissed) return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted, dismissed, handleScroll]);

  // Wheel/trackpad: show "Trackpad ↓" for 1–2s on desktop
  useEffect(() => {
    if (!mounted || dismissed || isMobile) return;
    const onWheel = () => {
      setCopyPhase('trackpad');
      if (trackpadHintTimer.current) clearTimeout(trackpadHintTimer.current);
      trackpadHintTimer.current = setTimeout(() => {
        setCopyPhase('sell');
      }, TRACKPAD_HINT_DURATION_MS);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      if (trackpadHintTimer.current) clearTimeout(trackpadHintTimer.current);
    };
  }, [mounted, dismissed, isMobile]);

  // Intent: cursor near fold (bottom of viewport) + pause >2s → emphasize + one shimmer (once per session)
  useEffect(() => {
    if (!mounted || dismissed || isMobile) return;
    const onMove = (e: MouseEvent) => {
      lastMoveRef.current = Date.now();
      lastMouseYRef.current = e.clientY;
    };
    const checkIntent = () => {
      if (intentTriggeredRef.current) return;
      const now = Date.now();
      const paused = now - lastMoveRef.current >= INTENT_PAUSE_MS;
      const viewportH = typeof window !== 'undefined' ? window.innerHeight : 0;
      const nearFold = viewportH > 0 && lastMouseYRef.current >= viewportH - FOLD_PROXIMITY_PX;
      if (paused && nearFold) {
        intentTriggeredRef.current = true;
        setEmphasize(true);
        setOpacity(1);
        setShimmer(true);
        setTimeout(() => {
          setShimmer(false);
          setTimeout(() => {
            setEmphasize(false);
            setOpacity(0.2);
          }, 600);
        }, 800);
      }
    };
    window.addEventListener('mousemove', onMove);
    const interval = setInterval(checkIntent, 500);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearInterval(interval);
    };
  }, [mounted, dismissed, isMobile]);

  const displayCopy =
    copyPhase === 'sell'
      ? 'Sell your items ↓'
      : copyPhase === 'trackpad'
        ? 'Trackpad ↓'
        : copyPhase === 'swipe'
          ? 'Swipe up'
          : isMobile
            ? 'Swipe up'
            : 'Scroll for more';

  if (!mounted || dismissed) return null;

  return (
    <div
      className="pointer-events-none absolute right-0 top-1/2 z-10 flex -translate-y-1/2 translate-x-[calc(100%-56px)] flex-col items-center transition-opacity"
      style={{
        opacity,
        transitionDuration: opacity === 0 ? `${FADE_OUT_MS}ms` : '300ms',
      }}
      aria-hidden
    >
      <div
        className={`scroll-hint-breathe flex flex-col items-center ${emphasize ? 'opacity-100' : ''} ${shimmer ? 'scroll-hint-shimmer' : ''}`}
      >
        <svg
          width="24"
          height="28"
          viewBox="0 0 24 28"
          fill="none"
          className="text-[var(--text-2)]"
          aria-hidden
        >
          <path
            d="M12 2v20M6 14l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="mt-1 whitespace-nowrap text-xs font-medium text-[var(--text-2)]">
          {displayCopy}
        </span>
      </div>
    </div>
  );
}
