import { useEffect, useState } from 'react';
import { formatYear, interpolateYear } from '@/core/years';
import { useT } from '@/i18n';

interface YearRollerProps {
  /** the year the roll starts from, e.g. the current year */
  from: number;
  /** the stops to visit in order; the last one is where the roll ends */
  stops: ReadonlyArray<{ year: number; approximate?: boolean }>;
  /** time spent on each leg, in milliseconds */
  legMs?: number;
  /** called once the roll has reached the last stop */
  onDone?: () => void;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The Lensa Waktu: a big year counter that rolls through the centuries to where the mission happens, so
 * a jump across thousands of years is something the player sees. With reduced motion it simply shows
 * the destination.
 */
export function YearRoller({ from, stops, legMs = 1600, onDone }: YearRollerProps) {
  const t = useT();
  const last = stops.at(-1);
  const [shown, setShown] = useState(() => (prefersReducedMotion() && last ? last.year : from));
  const [arrived, setArrived] = useState(() => prefersReducedMotion());

  // biome-ignore lint/correctness/useExhaustiveDependencies: the roll starts once; later prop changes do not restart it
  useEffect(() => {
    if (!last) return;
    if (prefersReducedMotion()) {
      onDone?.();
      return;
    }
    let frame = 0;
    let cancelled = false;
    const points = [from, ...stops.map((stop) => stop.year)];
    const started = performance.now();
    const total = legMs * (points.length - 1);

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = Math.min(total, now - started);
      const leg = Math.min(points.length - 2, Math.floor(elapsed / legMs));
      const progress = (elapsed - leg * legMs) / legMs;
      setShown(interpolateYear(points[leg] ?? from, points[leg + 1] ?? from, easeOut(progress)));
      if (elapsed < total) {
        frame = requestAnimationFrame(tick);
      } else {
        setShown(last.year);
        setArrived(true);
        onDone?.();
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">{t.lens.title}</p>
      {/* the rolling number is decoration; the destination is announced once it is reached */}
      <p
        aria-hidden="true"
        className="font-display text-5xl tabular-nums text-fg sm:text-6xl"
        data-testid="year-roller"
      >
        {formatYear(shown, arrived && (last?.approximate ?? false))}
      </p>
      <p className="sr-only" aria-live="polite">
        {arrived && last ? formatYear(last.year, last.approximate ?? false) : ''}
      </p>
    </div>
  );
}
