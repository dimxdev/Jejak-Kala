import { isWatered, type Plan, washedOutPlots } from '@/core/missions/nile-flood/model';
import type { NileFloodParams } from '@/core/missions/nile-flood/schema';
import { useT } from '@/i18n';

const WIDTH = 360;
const HEIGHT = 144;
const RIVER = 36; // width of the river on the left
const FLOOR = HEIGHT - 20; // y of the bottom of the ground (labels sit below)
const UNIT = 10; // pixels per hasta
const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7] as const; // seed positions on a plot (keys of the drawn sprouts)

interface FloodProfileProps {
  params: NileFloodParams;
  flood: number;
  plan: Plan;
}

/**
 * A cross-section of the fields from the river (left) up to the desert (right). The water line is the
 * flood; a plot is watered when its top is not above the line. A dug channel lowers the plot by one
 * hasta. Seeds sit on top of their plot, green where they will grow and grey where they will not.
 */
export function FloodProfile({ params, flood, plan }: FloodProfileProps) {
  const t = useT();
  const floor = params.floodRange.min - 2; // the hasta mark at the bottom of the drawing
  const y = (hasta: number) => FLOOR - (hasta - floor) * UNIT;
  const columnWidth = (WIDTH - RIVER) / params.plots.length;
  const washed = washedOutPlots(params, flood);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.nileFlood.plan.diagram}
      className="w-full rounded-xl border border-line bg-panel-2"
    >
      {/* sky glow */}
      <rect x="0" y="0" width={WIDTH} height={FLOOR} fill="var(--panel)" opacity="0.6" />

      {/* the ground, one block per plot */}
      {params.plots.map((plot, i) => {
        const x = RIVER + i * columnWidth;
        const channel = plan.labor[i] ?? 0;
        const gone = washed[i] === true;
        const top = y(gone ? floor + 1.5 : plot.needs);
        return (
          <g key={plot.id}>
            <rect
              x={x + 1}
              y={top}
              width={columnWidth - 2}
              height={FLOOR - top}
              fill="var(--sand)"
              stroke="var(--umber)"
              strokeWidth="1.5"
              opacity={gone ? 0.45 : 1}
            />
            <rect
              x={x + 1}
              y={top}
              width={columnWidth - 2}
              height="4"
              fill="var(--umber)"
              opacity={gone ? 0.3 : 0.55}
            />
            {channel > 0 && !gone && (
              // the dug channel: a notch cut into the top of the plot
              <rect
                x={x + columnWidth * 0.22}
                y={top}
                width={columnWidth * 0.56}
                height={UNIT}
                fill="var(--panel-2)"
                stroke="var(--umber)"
                strokeWidth="1"
              />
            )}
          </g>
        );
      })}

      {/* the river and the flood water, over the ground so submerged plots look wet */}
      <rect
        x="0"
        y={y(flood)}
        width={WIDTH}
        height={FLOOR - y(flood)}
        fill="var(--water)"
        opacity="0.45"
      />
      <line
        x1="0"
        x2={WIDTH}
        y1={y(flood)}
        y2={y(flood)}
        stroke="var(--good)"
        strokeWidth="2"
        strokeDasharray="6 4"
      />

      {/* seeds, number badges and the hasta each plot needs */}
      {params.plots.map((plot, i) => {
        const x = RIVER + i * columnWidth;
        const seeds = plan.seeds[i] ?? 0;
        const watered = isWatered(params, flood, plan, i, washed);
        const channel = plan.labor[i] ?? 0;
        const top = y(washed[i] ? floor + 1.5 : plot.needs - channel);
        return (
          <g key={`label-${plot.id}`}>
            {SLOTS.slice(0, seeds).map((slot) => (
              <g
                key={`seed-${plot.id}-${slot}`}
                transform={`translate(${x + columnWidth / 2 + (slot - (seeds - 1) / 2) * 14} ${top - 3})`}
              >
                <path
                  d="M0 0 V-9 M0 -6 Q-6 -8 -6 -13 Q0 -12 0 -6 M0 -8 Q6 -10 6 -15 Q0 -14 0 -8"
                  fill="none"
                  stroke={watered ? 'var(--good)' : 'var(--muted)'}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </g>
            ))}
            <circle
              cx={x + columnWidth / 2}
              cy={HEIGHT - 8}
              r="7"
              fill="var(--panel)"
              stroke="var(--line)"
            />
            <text
              x={x + columnWidth / 2}
              y={HEIGHT - 4.5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--fg)"
            >
              {i + 1}
            </text>
            <text
              x={x + columnWidth / 2}
              y={FLOOR - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="var(--fg)"
            >
              {plot.needs - channel}
            </text>
          </g>
        );
      })}

      <text
        x={4}
        y={y(flood) - 4}
        textAnchor="start"
        fontSize="11"
        fontWeight="700"
        fill="var(--good)"
      >
        {flood} {t.nileFlood.hasta}
      </text>
    </svg>
  );
}
