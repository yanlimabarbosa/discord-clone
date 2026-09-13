import { Suspense, lazy } from 'react';
import { useMe } from './hooks/auth/use-me';

// Split the two top-level surfaces: visitors never download the app shell,
// logged-in users never download the landing forms.
const LandingPage = lazy(() =>
  import('./pages/landing').then((m) => ({ default: m.LandingPage })),
);
const AppShell = lazy(() =>
  import('./pages/app-shell').then((m) => ({ default: m.AppShell })),
);

function Splash() {
  return (
    <div className="splash">
      <div className="splash-logo">◇</div>
    </div>
  );
}

export function App() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return <Splash />;
  }

  return (
    <Suspense fallback={<Splash />}>
      {user ? <AppShell /> : <LandingPage />}
    </Suspense>
  );
}
