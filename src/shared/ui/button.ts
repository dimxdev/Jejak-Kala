const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

const variants = {
  primary: 'bg-accent text-on-accent shadow-sm hover:brightness-110',
  ghost: 'border border-line bg-panel text-fg hover:border-accent',
  good: 'bg-good text-on-accent shadow-sm hover:brightness-110',
} as const;

export type ButtonVariant = keyof typeof variants;

/** Class names for a button-looking element, used for both <button> and <Link>. */
export function buttonClass(variant: ButtonVariant = 'primary'): string {
  return `${base} ${variants[variant]}`;
}
