import { Link } from 'react-router';
import { useT } from '@/i18n';
import { buttonClass } from '@/shared/ui/button';

export function NotFoundPage() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start gap-4 px-4 py-8">
      <h1 className="font-display text-2xl">{t.notFound.title}</h1>
      <Link to="/" className={buttonClass()}>
        {t.notFound.back}
      </Link>
    </main>
  );
}
