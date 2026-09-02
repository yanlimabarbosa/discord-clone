import { useMembers } from '../../hooks/members/use-members';
import type { Member } from '../../types/member';

type MemberListProps = {
  serverId: string | null;
};

function MemberRow({ member }: { member: Member }) {
  const initial = member.displayName.charAt(0).toUpperCase();
  return (
    <div className={`member-row ${member.online ? '' : 'member-offline'}`}>
      <div className="member-avatar-wrap">
        <div className="avatar member-avatar">{initial}</div>
        <span
          className={`presence-dot ${member.online ? 'presence-online' : 'presence-off'}`}
        />
      </div>
      <div className="member-info">
        <span className="member-name">{member.displayName}</span>
        {member.voiceChannelId && (
          <span className="member-voice">🔊 In voice</span>
        )}
      </div>
    </div>
  );
}

export function MemberList({ serverId }: MemberListProps) {
  const { data: members } = useMembers(serverId);
  if (!serverId) return null;

  const online = (members ?? []).filter((m) => m.online);
  const offline = (members ?? []).filter((m) => !m.online);

  return (
    <aside className="member-list">
      <div className="member-group-header">Online — {online.length}</div>
      {online.map((m) => (
        <MemberRow key={m.id} member={m} />
      ))}
      {offline.length > 0 && (
        <div className="member-group-header">Offline — {offline.length}</div>
      )}
      {offline.map((m) => (
        <MemberRow key={m.id} member={m} />
      ))}
    </aside>
  );
}
