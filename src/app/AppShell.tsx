import { Link, NavLink, Outlet } from 'react-router';
import { DEFAULT_PLAYER_NAME } from '@/core/progress/profile';
import { useProgressStore } from '@/features/progress';
import { useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { BookIcon, MapIcon } from '@/shared/ui/icons';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-xs font-semibold transition md:min-h-10 md:flex-none md:flex-row md:gap-2 md:text-sm ${
    isActive ? 'bg-accent text-on-accent' : 'text-muted hover:text-fg'
  }`;

/**
 * The frame around the map, chapter and Kodeks pages: a header with the game name and the player, and
 * the main navigation (at the bottom on a phone, in the header on a wider screen). Missions run outside
 * of it so they can use the whole screen.
 */
export function AppShell() {
  const t = useT();
  const profile = useProgressStore((s) => s.profile);
  const links = (
    <>
      <NavLink to="/" end className={navClass}>
        <MapIcon className="size-5" />
        {t.shell.map}
      </NavLink>
      <NavLink to="/kodeks" className={navClass}>
        <BookIcon className="size-5" />
        {t.shell.codex}
      </NavLink>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
      >
        {t.shell.skip}
      </a>

      <header className="sticky top-0 z-20 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Link to="/" className="font-display text-lg font-semibold leading-tight">
            {import.meta.env.VITE_APP_NAME}
          </Link>
          <nav aria-label={t.shell.nav} className="hidden gap-1 md:flex">
            {links}
          </nav>
          <Link
            to="/mulai"
            aria-label={t.shell.profile}
            title={t.shell.profile}
            className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-3 text-sm font-semibold hover:border-accent"
          >
            <img
              src={assetUrl(`shared/traveler-${profile?.traveler ?? 'a'}`)}
              alt=""
              aria-hidden="true"
              className="size-8 rounded-full bg-panel-2 object-cover object-top"
            />
            <span className="max-w-28 truncate">{profile?.name ?? DEFAULT_PLAYER_NAME}</span>
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 md:pb-8">
        <Outlet />
      </main>

      <nav
        aria-label={t.shell.nav}
        className="fixed inset-x-0 bottom-0 z-20 flex gap-1 border-t border-line bg-panel/95 px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {links}
      </nav>
    </div>
  );
}
