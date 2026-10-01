import { format, useT } from '@/i18n';
import { StarIcon } from './icons';

interface StarsProps {
  /** earned stars, 0 to `max` */
  value: number;
  max?: number;
  className?: string;
}

/** Three stars, filled up to `value`. The count is also available as text for screen readers. */
export function Stars({ value, max = 3, className = 'size-6' }: StarsProps) {
  const t = useT();
  return (
    <span
      role="img"
      aria-label={format(t.stars.label, { count: value })}
      className="inline-flex items-center gap-1"
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <StarIcon
          key={n}
          className={`${className} ${n <= value ? 'text-accent-soft' : 'text-line'}`}
        />
      ))}
    </span>
  );
}
