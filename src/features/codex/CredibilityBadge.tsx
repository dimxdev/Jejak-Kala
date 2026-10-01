import type { Credibility } from '@/core/codex/schema';
import { useT } from '@/i18n';
import { Badge, type BadgeTone } from '@/shared/ui/Badge';

const TONE: Record<Credibility, BadgeTone> = {
  proven: 'good',
  tradition: 'accent',
  debated: 'neutral',
  myth: 'bad',
  game: 'neutral',
};

/** The label that says how sure history is about an entry: Terbukti, Menurut tradisi, Perdebatan, ... */
export function CredibilityBadge({ credibility }: { credibility: Credibility }) {
  const t = useT();
  return (
    <span title={t.codex.credibilityHelp[credibility]}>
      <Badge tone={TONE[credibility]}>{t.codex.credibility[credibility]}</Badge>
    </span>
  );
}
