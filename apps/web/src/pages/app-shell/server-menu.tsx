import { useEffect, useRef } from 'react';
import { UserPlus, Settings, LogOut } from 'lucide-react';

type ServerMenuProps = {
  isOwner: boolean;
  canManageSettings: boolean;
  onInvite: () => void;
  onSettings: () => void;
  onLeave: () => void;
  onClose: () => void;
};

export function ServerMenu({
  isOwner,
  canManageSettings,
  onInvite,
  onSettings,
  onLeave,
  onClose,
}: ServerMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  return (
    <div className="server-menu" ref={ref}>
      <button
        className="server-menu-item"
        onClick={() => {
          onInvite();
          onClose();
        }}
      >
        <UserPlus size={16} />
        Invite People
      </button>
      {canManageSettings && (
        <button
          className="server-menu-item"
          onClick={() => {
            onSettings();
            onClose();
          }}
        >
          <Settings size={16} />
          Server Settings
        </button>
      )}
      {!isOwner && (
        <button
          className="server-menu-item server-menu-danger"
          onClick={() => {
            onLeave();
            onClose();
          }}
        >
          <LogOut size={16} />
          Leave Server
        </button>
      )}
    </div>
  );
}
