import type { RopeReading } from '@/core/missions/rope-survey/model';
import { format, useT } from '@/i18n';
import { SIDE_COLORS } from './SurveyField';

interface RopeMeterProps {
  knots: number;
  reading: RopeReading | null;
}

const decimal = (n: number) => n.toFixed(1).replace('.', ',');

/**
 * The knotted rope as the player sees it: one circle per knot, coloured by the side it is used for, and
 * the length of each side in knots. Sides that are not a whole number of knots are shown as "≈".
 */
export function RopeMeter({ knots, reading }: RopeMeterProps) {
  const t = useT();
  const text = t.ropeSurvey.rope;

  if (!reading) {
    return (
      <p className="rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm text-muted">
        {text.empty}
      </p>
    );
  }

  const sides = [
    { key: 'ab', name: 'A–B', whole: reading.ab, exact: reading.exact.ab },
    { key: 'ac', name: 'A–C', whole: reading.ac, exact: reading.exact.ac },
    { key: 'bc', name: 'B–C', whole: reading.bc, exact: reading.exact.bc },
  ] as const;

  // every knot gets the colour of the side it serves; whole sides only
  const cells: Array<{ id: string; color: string | null }> = [];
  for (const side of sides) {
    for (let i = 0; i < (side.whole ?? 0); i++) {
      cells.push({ id: `${side.key}-${i}`, color: SIDE_COLORS[side.key] });
    }
  }
  const total = Math.max(knots, cells.length);
  while (cells.length < total) cells.push({ id: `free-${cells.length}`, color: null });
  const over = reading.used !== null && reading.used > knots ? reading.used - knots : 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-panel-2 p-3">
      <p className="text-xs font-semibold text-muted">{format(text.meter, { knots })}</p>
      <div className="flex flex-wrap gap-1" aria-hidden="true">
        {cells.map((cell, index) => (
          <span
            key={cell.id}
            className={`size-5 rounded-full border-2 ${index >= knots ? 'border-bad' : 'border-umber'}`}
            style={{ background: cell.color ?? 'var(--panel)' }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-live="polite">
        {sides.map((side) => (
          <li key={side.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-3 rounded-full"
              style={{ background: SIDE_COLORS[side.key] }}
            />
            <span className="font-semibold tabular-nums">
              {side.whole !== null
                ? format(text.side, { name: side.name, n: side.whole })
                : format(text.sideApprox, { name: side.name, n: decimal(side.exact) })}
            </span>
          </li>
        ))}
      </ul>
      <p
        className={`text-sm font-semibold ${over > 0 ? 'text-bad' : 'text-muted'}`}
        aria-live="polite"
      >
        {reading.used === null ? text.usedNone : format(text.used, { used: reading.used, knots })}
        {over > 0 ? ` (${format(text.over, { n: over })})` : ''}
      </p>
    </div>
  );
}
