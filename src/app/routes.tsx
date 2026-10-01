import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
  ScrollRestoration,
  useLocation,
} from 'react-router';
import { DEFAULT_PLAYER_NAME } from '@/core/progress/profile';
import { ChapterPage } from '@/features/chapter';
import { OnboardingPage } from '@/features/onboarding';
import { useProgressStore } from '@/features/progress';
import { WorldMapPage } from '@/features/world-map';
import { PlayerProvider } from '@/shared/ui/player';
import { AppShell } from './AppShell';
import { NotFoundPage } from './NotFoundPage';

function RootLayout() {
  const profile = useProgressStore((s) => s.profile);
  const { pathname } = useLocation();

  // nobody plays before choosing a name and a traveler
  if (!profile && pathname !== '/mulai') return <Navigate to="/mulai" replace />;

  const player = {
    name: profile?.name ?? DEFAULT_PLAYER_NAME,
    portrait: `shared/traveler-${profile?.traveler ?? 'a'}`,
  };
  return (
    <PlayerProvider value={player}>
      <Outlet />
      <ScrollRestoration />
    </PlayerProvider>
  );
}

// The lab page exists in development and in `vite build --mode lab` (used to check bundle splitting).
const showLab = import.meta.env.DEV || import.meta.env.MODE === 'lab';

const devRoutes: RouteObject[] = showLab
  ? [
      {
        path: 'lab/phaser',
        lazy: async () => ({ Component: (await import('@/features/lab')).PhaserLabPage }),
      },
    ]
  : [];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'mulai', element: <OnboardingPage /> },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <WorldMapPage /> },
          { path: 'bab/:chapterId', element: <ChapterPage /> },
          {
            path: 'kodeks',
            lazy: async () => {
              const m = await import('@/features/codex');
              return { Component: m.CodexPage, loader: m.codexLoader };
            },
          },
          {
            path: 'kodeks/:chapterId/:entryId',
            lazy: async () => {
              const m = await import('@/features/codex');
              return { Component: m.CodexEntryPage, loader: m.codexEntryLoader };
            },
          },
        ],
      },
      // missions use the whole screen, so they sit outside of the shell
      {
        path: 'bab/:chapterId/misi/:missionId',
        lazy: async () => {
          const m = await import('@/features/missions');
          return { Component: m.MissionPage, loader: m.missionLoader };
        },
      },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
