'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'outfittr_scroll_hint_seen';
const IDLE_DIM_MS = 7000; // 6–8s: use 7s
const SCROLL_THRESHOLD_PX = 30;
const FADEOUT_MS = 300; // 250–350ms
const TOP_CLAMP_MIN = 120;
const TOP_CLAMP_MAX_OFFSET = 120;
const GAP_FROM_MEN_TILE = 20;
const MOBILE_BREAKPOINT = 768;

export type ScrollHintCueProps = {
  menTileRef: React.RefObject<HTMLDivElement | null>;
};

export default function ScrollHintCue({ menTileRef }: ScrollHintCueProps) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [dimmed, setDimmed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const vw = window.innerWidth;
    const mobile = vw < MOBILE_BREAKPOINT;

    if (mobile) {
      // In-flow: directly under the Women/Men tiles in the white section (no overlap)
      setStyle({
        position: 'static',
        width: '100%',
        marginTop: 20,
        marginBottom: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        pointerEvents: 'none',
      });
      return;
    }

    if (!menTileRef?.current) return;
    const menRect = menTileRef.current.getBoundingClientRect();
    const vh = window.innerHeight;

    // Desktop: to the right of Men tile, vertically aligned
    const cueHeight = 112; // video 80px + spacing
    const rawTop = menRect.top + menRect.height / 2 - cueHeight / 2;
    const top = Math.max(
      TOP_CLAMP_MIN,
      Math.min(vh - TOP_CLAMP_MAX_OFFSET - cueHeight, rawTop)
    );
    const left = menRect.right + GAP_FROM_MEN_TILE;

    setStyle({
      position: 'fixed',
      left: Math.min(left, vw - 220), // don't overflow right
      top,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      pointerEvents: 'none',
    });
  }, [menTileRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const handler = () => setReducedMotion(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setRemoved(true);
      return;
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || removed) return;
    const raf = requestAnimationFrame(() => updatePosition());
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [mounted, removed, updatePosition]);

  useEffect(() => {
    if (!mounted || removed) return;

    idleTimerRef.current = setTimeout(() => {
      setDimmed(true);
    }, IDLE_DIM_MS);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [mounted, removed]);

  useEffect(() => {
    if (!mounted || removed) return;

    const onScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      if (scrolled <= SCROLL_THRESHOLD_PX) return;

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch (_) {}
      setExiting(true);

      const t = setTimeout(() => setRemoved(true), FADEOUT_MS);
      return () => clearTimeout(t);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mounted, removed]);

  if (!mounted || removed) return null;

  const opacity = dimmed ? 0.2 : 1;
  const exitOpacity = exiting ? 0 : opacity;
  const transition = exiting ? `opacity ${FADEOUT_MS}ms ease-out` : undefined;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className="scroll-hint-cue"
      style={{
        ...style,
        opacity: exitOpacity,
        transition,
      }}
    >
      <div
        className={
          reducedMotion
            ? 'scroll-hint-cue-media static'
            : 'scroll-hint-cue-media animated'
        }
        style={{ width: 80, height: 80, flexShrink: 0 }}
      >
        <video
          src="/collections/Scroll%20Down.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain"
          aria-hidden
        />
      </div>
      <span
        className="text-base md:text-lg font-medium text-[var(--text-2)] whitespace-nowrap"
        style={{ opacity: 0.95 }}
      >
        Scroll to sell
      </span>
    </div>
  );
}
