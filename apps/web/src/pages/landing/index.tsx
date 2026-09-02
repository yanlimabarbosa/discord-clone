import { useState } from 'react';
import { GuestForm } from './guest-form';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { useLandingPage } from './use-landing-page';

type Tab = 'guest' | 'login' | 'register';

const TABS: { key: Tab; label: string }[] = [
  { key: 'guest', label: 'Guest' },
  { key: 'login', label: 'Log in' },
  { key: 'register', label: 'Register' },
];

export function LandingPage() {
  const [tab, setTab] = useState<Tab>('guest');
  const { guest, login, register } = useLandingPage();

  return (
    <div className="landing">
      <div className="landing-card">
        <div className="landing-brand">
          <div className="landing-logo">◇</div>
          <h1 className="landing-title">Welcome back</h1>
          <p className="landing-subtitle">
            Jump in as a guest, or sign in to keep your servers.
          </p>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? 'tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'guest' && (
          <GuestForm
            isPending={guest.isPending}
            error={guest.error}
            onSubmit={guest.submit}
          />
        )}
        {tab === 'login' && (
          <LoginForm
            isPending={login.isPending}
            error={login.error}
            onSubmit={login.submit}
          />
        )}
        {tab === 'register' && (
          <RegisterForm
            isPending={register.isPending}
            error={register.error}
            onSubmit={register.submit}
          />
        )}
      </div>
    </div>
  );
}
