import { PALMS_PER_CUBIT } from '@/core/missions/pyramid-climb/seked';

interface SekedDiagramProps {
  /** the pyramid the gate asks about, in cubits */
  base: number;
  height: number;
  /**
   * A face drawn from the apex with this seked (in palms). Santai shows it live so the player can see
   * whether it lands on the corner; Tantangan passes null and shows only the pyramid.
   */
  trial: number | null;
  /** the trial face is the right setting: it is drawn ending exactly on the corner */
  matches: boolean;
  labels: { base: string; height: string; corner: string };
  /** what a screen reader hears instead of the picture */
  description: string;
}

const WIDTH = 360;
const HEIGHT = 230;
const GROUND = 176;
const CENTRE = WIDTH / 2;

/**
 * A cross-section of a pyramid: the apex, the height, the base, and (optionally) the face the player is
 * trying out. A face with the right seked ends exactly on the corner of the base.
 */
export function SekedDiagram({
  base,
  height,
  trial,
  matches,
  labels,
  description,
}: SekedDiagramProps) {
  const unit = Math.min(300 / base, 140 / height);
  const apex = { x: CENTRE, y: GROUND - height * unit };
  const left = { x: CENTRE - (base / 2) * unit, y: GROUND };
  const right = { x: CENTRE + (base / 2) * unit, y: GROUND };

  // where the trial face would reach the ground (it may run past the edge of the picture)
  const run = trial === null ? 0 : (height * trial) / PALMS_PER_CUBIT;
  const reach = matches ? right.x : Math.min(CENTRE + run * unit, WIDTH - 8);
  const exact = trial !== null && matches;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={description}
      className="h-auto w-full rounded-xl border border-line bg-canvas"
    >
      <title>{description}</title>
      <line
        x1="8"
        y1={GROUND}
        x2={WIDTH - 8}
        y2={GROUND}
        className="stroke-umber"
        strokeWidth="3"
      />

      <polygon
        points={`${apex.x},${apex.y} ${left.x},${left.y} ${right.x},${right.y}`}
        className="fill-sand/50 stroke-umber"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line
        x1={apex.x}
        y1={apex.y}
        x2={CENTRE}
        y2={GROUND}
        className="stroke-umber"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />

      {/* the height */}
      <text
        x={CENTRE - 8}
        y={(apex.y + GROUND) / 2}
        textAnchor="end"
        className="fill-fg stroke-canvas"
        strokeWidth="4"
        paintOrder="stroke"
        fontSize="13"
      >
        {labels.height}
      </text>
      {/* the base */}
      <line
        x1={left.x}
        y1={GROUND + 18}
        x2={right.x}
        y2={GROUND + 18}
        className="stroke-fg"
        strokeWidth="1.5"
      />
      <line
        x1={left.x}
        y1={GROUND + 12}
        x2={left.x}
        y2={GROUND + 24}
        className="stroke-fg"
        strokeWidth="1.5"
      />
      <line
        x1={right.x}
        y1={GROUND + 12}
        x2={right.x}
        y2={GROUND + 24}
        className="stroke-fg"
        strokeWidth="1.5"
      />
      <text
        x={CENTRE}
        y={GROUND + 42}
        textAnchor="middle"
        className="fill-fg stroke-canvas"
        strokeWidth="4"
        paintOrder="stroke"
        fontSize="13"
      >
        {labels.base}
      </text>

      {trial !== null && (
        <>
          {/* how far the trial face misses the corner */}
          {!exact && (
            <line
              x1={reach}
              y1={GROUND - 6}
              x2={right.x}
              y2={GROUND - 6}
              className="stroke-bad"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          <line
            x1={apex.x}
            y1={apex.y}
            x2={reach}
            y2={GROUND}
            className={exact ? 'stroke-good' : 'stroke-accent'}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={right.x} cy={right.y} r="6" className={exact ? 'fill-good' : 'fill-bad'} />
          <text
            x={right.x}
            y={right.y - 14}
            textAnchor="middle"
            className="fill-fg stroke-canvas"
            strokeWidth="4"
            paintOrder="stroke"
            fontSize="12"
          >
            {labels.corner}
          </text>
        </>
      )}
    </svg>
  );
}
