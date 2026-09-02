import { useMe } from './hooks/auth/use-me';
import { LandingPage } from './pages/landing';
import { AppShell } from './pages/app-shell';

export function App() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="splash">
        <div className="splash-logo">◇</div>
      </div>
    );
  }

  return user ? <AppShell /> : <LandingPage />;
}
