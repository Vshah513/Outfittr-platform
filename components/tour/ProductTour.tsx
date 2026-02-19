'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'outfittr-tour-completed';
const SPOTLIGHT_PADDING = 10;
const SPOTLIGHT_RADIUS = 12;
const AUTO_START_DELAY = 1200;

interface TourStep {
  target: string;
  targetMobile?: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="marketplace"]',
    targetMobile: '[data-tour="marketplace-mobile"]',
    title: 'Explore the Marketplace',
    description:
      'Browse thousands of unique fashion items from sellers across Kenya.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="sell"]',
    targetMobile: '[data-tour="sell-mobile"]',
    title: 'Start Selling',
    description: 'List your clothes in minutes and reach buyers instantly.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="swipe-discovery"]',
    title: 'Discover by Swiping',
    description:
      'Swipe right to save items you love, or left to skip. It\u2019s that easy.',
    placement: 'top',
  },
  {
    target: '[data-tour="leaderboard"]',
    targetMobile: '[data-tour="leaderboard-mobile"]',
    title: 'Seller Leaderboard',
    description:
      'See top sellers, trending shops, and follow your favourites.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="get-started"]',
    title: 'Join the Community',
    description: 'Create your account and start buying or selling today.',
    placement: 'top',
  },
];

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  endTour: () => void;
  next: () => void;
  prev: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within ProductTourProvider');
  return ctx;
}

export function ProductTourProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  }, []);

  const next = useCallback(() => {
    setCurrentStep((s) => {
      if (s >= TOUR_STEPS.length - 1) {
        setIsActive(false);
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
        } catch {}
        return 0;
      }
      return s + 1;
    });
  }, []);

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(startTour, AUTO_START_DELAY);
    return () => clearTimeout(timer);
  }, [startTour]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        startTour,
        endTour,
        next,
        prev,
      }}
    >
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Rect helpers
// ---------------------------------------------------------------------------

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getTargetRect(step: TourStep): Rect | null {
  const isMobile = window.innerWidth < 768;
  const selector =
    isMobile && step.targetMobile ? step.targetMobile : step.target;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

function padRect(r: Rect, pad: number): Rect {
  return {
    x: r.x - pad,
    y: r.y - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

// ---------------------------------------------------------------------------
// Tooltip positioning
// ---------------------------------------------------------------------------

interface TooltipPos {
  top: number;
  left: number;
  transformOrigin: string;
  actualPlacement: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 340;

function computeTooltipPos(
  rect: Rect,
  placement: TourStep['placement'],
): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padded = padRect(rect, SPOTLIGHT_PADDING);
  const tooltipW = Math.min(TOOLTIP_WIDTH, vw - 32);

  const tryBottom = (): TooltipPos | null => {
    const top = padded.y + padded.height + TOOLTIP_GAP;
    if (top + 120 > vh) return null;
    return {
      top,
      left: clampX(padded.x + padded.width / 2 - tooltipW / 2, tooltipW, vw),
      transformOrigin: 'top center',
      actualPlacement: 'bottom',
    };
  };

  const tryTop = (): TooltipPos | null => {
    const top = padded.y - TOOLTIP_GAP;
    if (top < 120) return null;
    return {
      top,
      left: clampX(padded.x + padded.width / 2 - tooltipW / 2, tooltipW, vw),
      transformOrigin: 'bottom center',
      actualPlacement: 'top',
    };
  };

  const tryRight = (): TooltipPos | null => {
    const left = padded.x + padded.width + TOOLTIP_GAP;
    if (left + tooltipW > vw - 16) return null;
    return {
      top: padded.y + padded.height / 2,
      left,
      transformOrigin: 'left center',
      actualPlacement: 'right',
    };
  };

  const tryLeft = (): TooltipPos | null => {
    const left = padded.x - TOOLTIP_GAP - tooltipW;
    if (left < 16) return null;
    return {
      top: padded.y + padded.height / 2,
      left,
      transformOrigin: 'right center',
      actualPlacement: 'left',
    };
  };

  const order: Record<string, (() => TooltipPos | null)[]> = {
    bottom: [tryBottom, tryTop, tryRight, tryLeft],
    top: [tryTop, tryBottom, tryRight, tryLeft],
    left: [tryLeft, tryRight, tryBottom, tryTop],
    right: [tryRight, tryLeft, tryBottom, tryTop],
  };

  for (const fn of order[placement]) {
    const pos = fn();
    if (pos) return pos;
  }

  return {
    top: padded.y + padded.height + TOOLTIP_GAP,
    left: clampX(padded.x + padded.width / 2 - tooltipW / 2, tooltipW, vw),
    transformOrigin: 'top center',
    actualPlacement: 'bottom',
  };
}

function clampX(x: number, w: number, vw: number): number {
  return Math.max(16, Math.min(x, vw - w - 16));
}

// ---------------------------------------------------------------------------
// Overlay component
// ---------------------------------------------------------------------------

function TourOverlay() {
  const ctx = useContext(TourContext);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => setMounted(true), []);

  const measure = useCallback(() => {
    if (!ctx?.isActive) return;
    const step = TOUR_STEPS[ctx.currentStep];
    if (!step) return;
    const r = getTargetRect(step);
    if (!r) return;
    setRect(r);
    setTooltipPos(computeTooltipPos(r, step.placement));
  }, [ctx?.isActive, ctx?.currentStep]);

  // Scroll target into view then measure
  useEffect(() => {
    if (!ctx?.isActive) return;
    const step = TOUR_STEPS[ctx.currentStep];
    if (!step) return;

    const isMobile = window.innerWidth < 768;
    const selector =
      isMobile && step.targetMobile ? step.targetMobile : step.target;
    const el = document.querySelector(selector);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Measure immediately (works when element is already in view) and
    // again after scroll settles for off-screen targets
    measure();
    const timer = setTimeout(measure, 500);
    return () => clearTimeout(timer);
  }, [ctx?.isActive, ctx?.currentStep, measure]);

  // Re-measure on scroll / resize
  useEffect(() => {
    if (!ctx?.isActive) return;
    const onUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onUpdate, true);
    window.addEventListener('resize', onUpdate);
    return () => {
      window.removeEventListener('scroll', onUpdate, true);
      window.removeEventListener('resize', onUpdate);
      cancelAnimationFrame(rafRef.current);
    };
  }, [ctx?.isActive, measure]);

  // Keyboard navigation
  useEffect(() => {
    if (!ctx?.isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ctx.endTour();
      if (e.key === 'ArrowRight') ctx.next();
      if (e.key === 'ArrowLeft') ctx.prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ctx]);

  // Block user-initiated scroll while allowing programmatic scrollIntoView
  useEffect(() => {
    if (!ctx?.isActive) return;
    const prevent = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      window.removeEventListener('wheel', prevent);
      window.removeEventListener('touchmove', prevent);
    };
  }, [ctx?.isActive]);

  if (!mounted || !ctx?.isActive || !rect || !tooltipPos) return null;

  const step = TOUR_STEPS[ctx.currentStep];
  const padded = padRect(rect, SPOTLIGHT_PADDING);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const overlay = (
    <AnimatePresence mode="wait">
      {ctx.isActive && (
        <motion.div
          key="tour-overlay"
          className="fixed inset-0"
          style={{ zIndex: 99998 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* SVG backdrop with spotlight cutout */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id="tour-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <motion.rect
                  fill="black"
                  rx={SPOTLIGHT_RADIUS}
                  ry={SPOTLIGHT_RADIUS}
                  animate={{
                    x: padded.x,
                    y: padded.y,
                    width: padded.width,
                    height: padded.height,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.6)"
              mask="url(#tour-spotlight-mask)"
              style={{ backdropFilter: 'blur(2px)' }}
            />
          </svg>

          {/* Click-blocker everywhere except the spotlight area */}
          <div
            className="absolute inset-0"
            onClick={ctx.endTour}
            aria-hidden="true"
          />

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={ctx.currentStep}
              className="absolute"
              style={{
                zIndex: 99999,
                width: Math.min(TOOLTIP_WIDTH, vw - 32),
                top:
                  tooltipPos.actualPlacement === 'top'
                    ? 'auto'
                    : tooltipPos.top,
                bottom:
                  tooltipPos.actualPlacement === 'top'
                    ? vh - tooltipPos.top
                    : 'auto',
                left: tooltipPos.left,
                transformOrigin: tooltipPos.transformOrigin,
              }}
              initial={{ opacity: 0, scale: 0.92, y: tooltipPos.actualPlacement === 'top' ? 8 : -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <div
                className="rounded-2xl shadow-2xl border overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Step counter badge */}
                <div
                  className="px-5 pt-4 pb-0 flex items-center justify-between"
                >
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--brand-2)' }}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Step {ctx.currentStep + 1} of {ctx.totalSteps}
                  </span>
                  <button
                    onClick={ctx.endTour}
                    className="p-1 rounded-full transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--text)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--text-3)')
                    }
                    aria-label="Close tour"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="px-5 pt-3 pb-2">
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{
                      fontFamily: 'var(--font-editorial)',
                      color: 'var(--text)',
                      fontSize: '1.25rem',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Footer: dots + nav buttons */}
                <div className="px-5 pb-4 pt-2 flex items-center justify-between gap-3">
                  {/* Step dots */}
                  <div className="flex items-center gap-1.5">
                    {TOUR_STEPS.map((_, i) => (
                      <span
                        key={i}
                        className="block rounded-full transition-all duration-300"
                        style={{
                          width: i === ctx.currentStep ? 18 : 6,
                          height: 6,
                          background:
                            i === ctx.currentStep
                              ? 'var(--brand-2)'
                              : 'var(--border)',
                          borderRadius: 999,
                        }}
                      />
                    ))}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex items-center gap-2">
                    {ctx.currentStep > 0 && (
                      <button
                        onClick={ctx.prev}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                        style={{
                          color: 'var(--text-2)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        Back
                      </button>
                    )}
                    {ctx.currentStep === 0 && (
                      <button
                        onClick={ctx.endTour}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                        style={{
                          color: 'var(--text-2)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        Skip
                      </button>
                    )}
                    <button
                      onClick={ctx.next}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
                      style={{
                        background: 'var(--text)',
                        color: 'var(--bg)',
                      }}
                    >
                      {ctx.currentStep === ctx.totalSteps - 1
                        ? 'Get Started'
                        : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
