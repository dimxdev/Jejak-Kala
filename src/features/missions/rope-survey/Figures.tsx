import { format, useT } from '@/i18n';

const MARGIN = 22;

function Grid({ w, h, unit }: { w: number; h: number; unit: number }) {
  return (
    <g stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4">
      {Array.from({ length: w + 1 }, (_, x) => x).map((x) => (
        <line
          key={`v${x}`}
          x1={MARGIN + x * unit}
          x2={MARGIN + x * unit}
          y1={MARGIN}
          y2={MARGIN + h * unit}
        />
      ))}
      {Array.from({ length: h + 1 }, (_, y) => y).map((y) => (
        <line
          key={`h${y}`}
          y1={MARGIN + y * unit}
          y2={MARGIN + y * unit}
          x1={MARGIN}
          x2={MARGIN + w * unit}
        />
      ))}
    </g>
  );
}

interface TriangleFigureProps {
  base: number;
  height: number;
  /** draw the rectangle around the triangle (the "half of a rectangle" hint) */
  framed: boolean;
}

/** The triangular field of Rhind problem 51 on a grid of khet: base at the bottom, apex above its middle. */
export function TriangleFigure({ base, height, framed }: TriangleFigureProps) {
  const t = useT();
  const unit = 24;
  const width = base * unit + MARGIN * 2;
  const total = height * unit + MARGIN * 2;
  const x = (n: number) => MARGIN + n * unit;
  const y = (n: number) => MARGIN + n * unit;

  return (
    <svg
      viewBox={`0 0 ${width} ${total}`}
      role="img"
      aria-label={format(t.ropeSurvey.triangle.figure, { base, height })}
      className="mx-auto h-72 w-auto max-w-full rounded-2xl border border-line bg-panel"
    >
      <rect x="0" y="0" width={width} height={total} fill="var(--sand)" opacity="0.3" />
      <Grid w={base} h={height} unit={unit} />
      {framed && (
        <rect
          x={x(0)}
          y={y(0)}
          width={base * unit}
          height={height * unit}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      )}
      <polygon
        points={`${x(0)},${y(height)} ${x(base)},${y(height)} ${x(base / 2)},${y(0)}`}
        fill="var(--good)"
        fillOpacity="0.25"
        stroke="var(--umber)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line
        x1={x(base / 2)}
        x2={x(base / 2)}
        y1={y(0)}
        y2={y(height)}
        stroke="var(--umber)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <text
        x={x(base / 2)}
        y={y(height) + 15}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="var(--fg)"
      >
        {base} khet
      </text>
      <text
        x={x(base / 2) + 6}
        y={y(height / 2)}
        fontSize="12"
        fontWeight="700"
        fill="var(--fg)"
        stroke="var(--panel)"
        strokeWidth="3"
        paintOrder="stroke"
      >
        {height} khet
      </text>
    </svg>
  );
}

interface CircleFigureProps {
  diameter: number;
  /** draw the square of side 8/9 of the diameter that the Egyptian method uses */
  showSquare: boolean;
}

/** The round field of Rhind problem 50 on a grid of khet, optionally with the square the method uses. */
export function CircleFigure({ diameter, showSquare }: CircleFigureProps) {
  const t = useT();
  const unit = 22;
  const size = diameter * unit + MARGIN * 2;
  const centre = MARGIN + (diameter * unit) / 2;
  const side = (diameter - diameter / 9) * unit;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={format(t.ropeSurvey.circle.figure, { d: diameter })}
      className="mx-auto h-64 w-auto max-w-full rounded-2xl border border-line bg-panel"
    >
      <rect x="0" y="0" width={size} height={size} fill="var(--sand)" opacity="0.3" />
      <Grid w={diameter} h={diameter} unit={unit} />
      <circle
        cx={centre}
        cy={centre}
        r={(diameter * unit) / 2}
        fill="var(--good)"
        fillOpacity="0.25"
        stroke="var(--umber)"
        strokeWidth="3"
      />
      {showSquare && (
        <rect
          x={centre - side / 2}
          y={centre - side / 2}
          width={side}
          height={side}
          fill="var(--accent-soft)"
          fillOpacity="0.3"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
      )}
      <line
        x1={MARGIN}
        x2={MARGIN + diameter * unit}
        y1={centre}
        y2={centre}
        stroke="var(--umber)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <text
        x={centre}
        y={centre - 6}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="var(--fg)"
        stroke="var(--panel)"
        strokeWidth="3"
        paintOrder="stroke"
      >
        {diameter} khet
      </text>
    </svg>
  );
}
