import { useState } from 'react';
import { useInvitePage } from './use-invite-page';

export function InvitePage() {
  const invite = useInvitePage();
  const [nickname, setNickname] = useState('');

  if (invite.loading) {
    return (
      <div className="splash">
        <div className="splash-logo">◇</div>
      </div>
    );
  }

  return (
    <div className="landing">
      <div className="landing-card">
        <div className="landing-brand">
          <div className="landing-logo">◇</div>
          {invite.invalid || !invite.serverName ? (
            <>
              <h1 className="landing-title">Invite invalid</h1>
              <p className="landing-subtitle">
                This invite is expired or doesn't exist.
              </p>
            </>
          ) : (
            <>
              <h1 className="landing-title">You're invited</h1>
              <p className="landing-subtitle">
                Join <b>{invite.serverName}</b>
              </p>
            </>
          )}
        </div>

        {!invite.invalid && invite.serverName && (
          <div className="auth-form">
            {invite.isLoggedIn ? (
              <button
                className="btn-primary"
                disabled={invite.joining}
                onClick={invite.acceptAsUser}
              >
                {invite.joining
                  ? 'Joining…'
                  : `Join as ${invite.userName}`}
              </button>
            ) : (
              <>
                <label className="field-label">Nickname</label>
                <input
                  className="field-input"
                  placeholder="Pick a name"
                  autoFocus
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <button
                  className="btn-primary"
                  disabled={invite.joining || nickname.trim().length < 2}
                  onClick={() => invite.acceptAsGuest(nickname.trim())}
                >
                  {invite.joining ? 'Joining…' : 'Join as guest'}
                </button>
              </>
            )}
            {invite.error && <span className="field-error">{invite.error}</span>}
          </div>
        )}

        {invite.invalid && (
          <button className="btn-primary" onClick={invite.goHome}>
            Go home
          </button>
        )}
      </div>
    </div>
  );
}
