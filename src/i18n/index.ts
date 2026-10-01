import { id, type Messages } from './id';

/** Returns the app's messages. Components call this hook so a language switch can be added later. */
export function useT(): Messages {
  return id;
}

/** Fills `{name}` placeholders: format('{done} dari {total}', { done: 2, total: 6 }). */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
