import { samePoint } from '@/core/missions/rope-survey/model';
import type { Point } from '@/core/missions/rope-survey/schema';
import { format, useT } from '@/i18n';

const UNIT = 48; // drawing units per khet
const MARGIN = 30;

/** The colours of the three sides of the rope triangle; RopeMeter uses the same ones. */
export const SIDE_COLORS = {
  ab: 'var(--umber)',
  ac: 'var(--good)',
  bc: 'var(--accent-soft)',
} as const;

interface SurveyFieldProps {
  grid: { width: number; height: number };
  /** the stakes that survived the flood */
  a: Point;
  b: Point;
  /** the stakes the player has set */
  c: Point | null;
  d: Point | null;
  /** draw the rope triangle A B C (when C is set) */
  showRope: boolean;
  /** the right angle at A is confirmed */
  rightAngle: boolean;
  /** the plot is restored: fill it in */
  restored: boolean;
  /** which stake a tap sets: "c", "d", or null when the field is only to look at */
  settable: 'c' | 'd' | null;
  onSet: (point: Point) => void;
}

const px = (x: number) => MARGIN + x * UNIT;

/** Knots along a segment: one at every whole khet from the start, never at the far end. */
function knotsAlong(from: Point, to: Point): Array<{ x: number; y: number; key: string }> {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const knots: Array<{ x: number; y: number; key: string }> = [];
  for (let step = 1; step < length - 1e-9; step++) {
    const t = step / length;
    knots.push({
      x: px(from[0] + (to[0] - from[0]) * t),
      y: px(from[1] + (to[1] - from[1]) * t),
      key: `${from.join('-')}:${to.join('-')}:${step}`,
    });
  }
  return knots;
}

/**
 * The flooded field as a grid of points one khet apart. A and B stand; the player taps a point to set
 * stake C or D. Every point is a real button, so the field works with touch, mouse and keyboard.
 */
export function SurveyField({
  grid,
  a,
  b,
  c,
  d,
  showRope,
  rightAngle,
  restored,
  settable,
  onSet,
}: SurveyFieldProps) {
  const t = useT();
  const width = grid.width * UNIT + MARGIN * 2;
  const height = grid.height * UNIT + MARGIN * 2;
  const stakes: Array<{ name: string; point: Point; fixed: boolean }> = [
    { name: 'A', point: a, fixed: true },
    { name: 'B', point: b, fixed: true },
    ...(c ? [{ name: 'C', point: c, fixed: false }] : []),
    ...(d ? [{ name: 'D', point: d, fixed: false }] : []),
  ];
  const points = Array.from({ length: (grid.width + 1) * (grid.height + 1) }, (_, i) => ({
    x: i % (grid.width + 1),
    y: Math.floor(i / (grid.width + 1)),
  }));

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{t.ropeSurvey.field.group}</legend>
      <div
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-line bg-panel shadow-inner"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 size-full"
        >
          {/* the damp ground and the grid of khet */}
          <rect x="0" y="0" width={width} height={height} fill="var(--sand)" opacity="0.35" />
          {Array.from({ length: grid.width + 1 }, (_, x) => x).map((x) => (
            <line
              key={`v${x}`}
              x1={px(x)}
              x2={px(x)}
              y1={px(0)}
              y2={px(grid.height)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))}
          {Array.from({ length: grid.height + 1 }, (_, y) => y).map((y) => (
            <line
              key={`h${y}`}
              x1={px(0)}
              x2={px(grid.width)}
              y1={px(y)}
              y2={px(y)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))}

          {/* the restored plot */}
          {restored && c && d && (
            <rect
              x={px(a[0])}
              y={px(a[1])}
              width={(b[0] - a[0]) * UNIT}
              height={(c[1] - a[1]) * UNIT}
              fill="var(--good)"
              opacity="0.22"
              stroke="var(--good)"
              strokeWidth="2"
            />
          )}
          {restored && c && d && (
            <rect
              x={px(a[0])}
              y={px(a[1])}
              width={(b[0] - a[0]) * UNIT}
              height={(c[1] - a[1]) * UNIT}
              fill="none"
              stroke="var(--umber)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          )}

          {/* the rope: A B is fixed, the other two sides follow stake C */}
          {showRope && c && (
            <g strokeLinecap="round" fill="none" strokeWidth="4">
              <line
                x1={px(a[0])}
                y1={px(a[1])}
                x2={px(b[0])}
                y2={px(b[1])}
                stroke={SIDE_COLORS.ab}
              />
              <line
                x1={px(a[0])}
                y1={px(a[1])}
                x2={px(c[0])}
                y2={px(c[1])}
                stroke={SIDE_COLORS.ac}
              />
              <line
                x1={px(b[0])}
                y1={px(b[1])}
                x2={px(c[0])}
                y2={px(c[1])}
                stroke={SIDE_COLORS.bc}
              />
            </g>
          )}
          {showRope &&
            c &&
            [...knotsAlong(a, b), ...knotsAlong(a, c), ...knotsAlong(b, c)].map((knot) => (
              <circle
                key={knot.key}
                cx={knot.x}
                cy={knot.y}
                r="4.5"
                fill="var(--panel)"
                stroke="var(--umber)"
                strokeWidth="1.5"
              />
            ))}

          {/* the right angle at A */}
          {rightAngle && c && (
            <path
              d={`M ${px(a[0]) + 16} ${px(a[1])} L ${px(a[0]) + 16} ${px(a[1]) + 16} L ${px(a[0])} ${px(a[1]) + 16}`}
              fill="none"
              stroke="var(--good)"
              strokeWidth="3"
            />
          )}

          {/* the stakes */}
          {stakes.map(({ name, point, fixed }) => (
            <g key={name} transform={`translate(${px(point[0])} ${px(point[1])})`}>
              <ellipse cx="0" cy="7" rx="9" ry="3.5" fill="var(--umber)" opacity="0.25" />
              <path
                d="M -5 7 L -5 -8 Q 0 -13 5 -8 L 5 7 Z"
                fill={fixed ? 'var(--umber)' : 'var(--sand)'}
                stroke="var(--umber)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <text
                x="0"
                y="-17"
                textAnchor="middle"
                fontSize="14"
                fontWeight="800"
                fill="var(--fg)"
                stroke="var(--panel)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {name}
              </text>
            </g>
          ))}
        </svg>

        {/* one button per grid point: this is what makes the field playable */}
        {points.map(({ x, y }) => {
          const stake = stakes.find((s) => samePoint(s.point, [x, y]));
          const fixedHere = stake?.fixed === true;
          const label = stake
            ? fixedHere
              ? format(t.ropeSurvey.field.fixed, { name: stake.name })
              : format(t.ropeSurvey.field.pointPlaced, { x, y, name: stake.name })
            : format(t.ropeSurvey.field.point, { x, y });
          return (
            <button
              key={`${x}-${y}`}
              type="button"
              aria-label={label}
              aria-pressed={stake && !fixedHere ? true : undefined}
              disabled={settable === null || fixedHere}
              onClick={() => onSet([x, y])}
              className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition hover:bg-accent/15 disabled:cursor-default disabled:hover:bg-transparent"
              style={{ left: `${(px(x) / width) * 100}%`, top: `${(px(y) / height) * 100}%` }}
            >
              {!stake && <span aria-hidden="true" className="size-2 rounded-full bg-umber/50" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
