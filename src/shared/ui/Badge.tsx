import type { ReactNode } from 'react';

const tones = {
  neutral: 'border-line bg-panel-2 text-muted',
  accent: 'border-accent/40 bg-accent/10 text-accent',
  good: 'border-good/40 bg-good-soft text-good',
  bad: 'border-bad/40 bg-bad-soft text-bad',
} as const;

export type BadgeTone = keyof typeof tones;

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
