import { useAppShell } from './use-app-shell';

export function AppShell() {
  const { user, logout, loggingOut } = useAppShell();
  const initial = user?.displayName?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="shell">
      <nav className="server-rail">
        <button className="server-pill server-home" title="Home">
          ◇
        </button>
        <div className="server-divider" />
        <button className="server-pill server-add" title="Add a server">
          +
        </button>
      </nav>

      <aside className="channel-sidebar">
        <div className="sidebar-header">Direct Messages</div>
        <div className="sidebar-body">
          <div className="sidebar-empty">
            No servers yet. Servers &amp; channels land in the next update.
          </div>
        </div>
        <div className="user-panel">
          <div className="avatar">{initial}</div>
          <div className="user-panel-info">
            <span className="user-panel-name">{user?.displayName}</span>
            <span className="user-panel-tag">
              {user?.isGuest ? 'Guest' : user?.username ?? 'Member'}
            </span>
          </div>
          <button
            className="icon-btn"
            title="Log out"
            onClick={logout}
            disabled={loggingOut}
          >
            ⏻
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <span className="content-title"># welcome</span>
        </header>
        <div className="content-empty">
          <div className="content-empty-logo">◇</div>
          <h2>You're in, {user?.displayName}.</h2>
          <p>
            Auth works. Next up: create servers, invite friends, and text +
            voice channels.
          </p>
        </div>
      </main>
    </div>
  );
}
