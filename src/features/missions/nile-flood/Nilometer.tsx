import { useEffect, useState } from 'react';
import { format, useT } from '@/i18n';

const ROW = 44; // pixels per hasta: big enough to tap with a thumb

interface NilometerProps {
  /** the real flood height, in hasta */
  flood: number;
  /** lowest and highest mark drawn on the pillar */
  low: number;
  high: number;
  /** the mark the player chose last, if any */
  picked: number | null;
  /** the reading was right: the right mark is outlined and further taps are ignored */
  solved: boolean;
  /** outline the right mark as a hint */
  revealed: boolean;
  onPick: (mark: number) => void;
}

/**
 * The Nilometer: a stone pillar marked in hasta, with the flood water standing against it. The player
 * reads the mark where the water surface stops and taps it. Every mark is a real button.
 */
export function Nilometer({ flood, low, high, picked, solved, revealed, onPick }: NilometerProps) {
  const t = useT();
  const marks = Array.from({ length: high - low + 1 }, (_, i) => low + i);

  // the water rises from the bottom once the pillar is on screen
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLevel((flood - low + 0.5) * ROW));
    return () => cancelAnimationFrame(frame);
  }, [flood, low]);

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{t.nileFlood.read.scale}</legend>
      <div
        className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl border-2 border-line bg-panel-2 shadow-inner"
        style={{ height: marks.length * ROW }}
      >
        {/* the water */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 bg-water/75 transition-[height] duration-[2400ms] ease-out"
          style={{ height: level }}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            className="absolute -top-2.5 left-0 h-3 w-[200%] animate-wave text-water/75"
            fill="currentColor"
          >
            <path d="M0 6 Q12.5 0 25 6 T50 6 T75 6 T100 6 T125 6 T150 6 T175 6 T200 6 V12 H0Z" />
          </svg>
        </div>

        {/* the pillar */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 w-28 -translate-x-1/2 border-x-4 border-umber bg-sand/90"
        />

        <div className="absolute inset-0 flex flex-col-reverse">
          {marks.map((mark) => {
            const isPicked = picked === mark;
            const isRight = mark === flood;
            const state =
              solved && isRight
                ? 'ring-4 ring-inset ring-good bg-good-soft/70'
                : revealed && isRight
                  ? 'ring-4 ring-inset ring-accent animate-pulse'
                  : isPicked
                    ? 'ring-4 ring-inset ring-bad bg-bad-soft/70 animate-shake'
                    : 'hover:bg-panel/40';
            return (
              <button
                key={mark}
                type="button"
                disabled={solved}
                aria-label={format(t.nileFlood.read.mark, { n: mark })}
                aria-pressed={isPicked}
                onClick={() => onPick(mark)}
                className={`relative flex items-center rounded-md px-2 transition disabled:cursor-default ${state}`}
                style={{ height: ROW }}
              >
                <span className="w-9 text-left text-sm font-bold tabular-nums text-fg">{mark}</span>
                <span aria-hidden="true" className="h-0.5 flex-1 bg-umber/70" />
                <span className="w-9 text-right text-[10px] font-semibold uppercase tracking-wide text-umber">
                  {t.nileFlood.hasta}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
