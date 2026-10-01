import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useT } from '@/i18n';
import { buttonClass } from '@/shared/ui/button';

/** Development-only page: checks that the Phaser engine loads lazily and runs inside the React shell. */
export function PhaserLabPage() {
  const t = useT();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    import('@/game/createGame').then(({ createGame }) => {
      if (!cancelled && host.current) game = createGame(host.current);
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <p className="text-sm text-muted">{t.lab.phaser}</p>
      <div
        ref={host}
        className="aspect-video w-full overflow-hidden rounded-2xl border border-line"
      />
      <Link to="/" className={buttonClass('ghost')}>
        {t.notFound.back}
      </Link>
    </main>
  );
}
