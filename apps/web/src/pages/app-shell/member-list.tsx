import { useState } from 'react';
import { useMembers } from '../../hooks/members/use-members';
import { useSpeaking } from '../../hooks/realtime/use-speaking';
import type { Member } from '../../types/member';
import { Avatar } from '../../components/avatar';
import { ProfileCard } from './profile-card';
import { Volume2 } from 'lucide-react';

type MemberListProps = {
  serverId: string | null;
};

function MemberRow({
  member,
  onOpenProfile,
}: {
  member: Member;
  onOpenProfile: (member: Member) => void;
}) {
  const speaking = useSpeaking();
  const isSpeaking = !!speaking[member.id];
  return (
    <div
      className={`member-row ${member.online ? '' : 'member-offline'}`}
      onClick={() => onOpenProfile(member)}
    >
      <div className="member-avatar-wrap">
        <Avatar
          name={member.displayName}
          avatarUrl={member.avatarUrl}
          size={32}
          className={`member-avatar ${isSpeaking ? 'avatar-speaking' : ''}`}
        />
        <span
          className={`presence-dot ${member.online ? 'presence-online' : 'presence-off'}`}
        />
      </div>
      <div className="member-info">
        <span className="member-name">{member.displayName}</span>
        {member.voiceChannelId && (
          <span className="member-voice">
            <Volume2 size={12} /> In voice
          </span>
        )}
      </div>
    </div>
  );
}

export function MemberList({ serverId }: MemberListProps) {
  const { data: members } = useMembers(serverId);
  const [profile, setProfile] = useState<Member | null>(null);
  if (!serverId) return null;

  const online = (members ?? []).filter((m) => m.online);
  const offline = (members ?? []).filter((m) => !m.online);

  return (
    <aside className="member-list">
      <div className="member-group-header">Online — {online.length}</div>
      {online.map((m) => (
        <MemberRow key={m.id} member={m} onOpenProfile={setProfile} />
      ))}
      {offline.length > 0 && (
        <div className="member-group-header">Offline — {offline.length}</div>
      )}
      {offline.map((m) => (
        <MemberRow key={m.id} member={m} onOpenProfile={setProfile} />
      ))}
      {profile && (
        <ProfileCard user={profile} onClose={() => setProfile(null)} />
      )}
    </aside>
  );
}
