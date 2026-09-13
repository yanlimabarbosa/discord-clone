import { memo, useMemo, useState } from 'react';
import { useMembers } from '../../hooks/members/use-members';
import { useRoles } from '../../hooks/roles/use-roles';
import { useSpeakingFor } from '../../hooks/realtime/use-speaking';
import { useMe } from '../../hooks/auth/use-me';
import type { Member } from '../../types/member';
import { Avatar } from '../../components/avatar';
import { ProfileCard } from './profile-card';
import { SkeletonRows } from './skeleton-rows';
import { Volume2 } from 'lucide-react';

type MemberListProps = {
  serverId: string | null;
  onMessageUser?: (userId: string) => void;
};

// The server's default role color — treated as "no color" (Discord-style).
const DEFAULT_ROLE_COLOR = '#99aab5';

const MemberRow = memo(function MemberRow({
  member,
  roleColor,
  onOpenProfile,
}: {
  member: Member;
  roleColor: string | undefined;
  onOpenProfile: (member: Member) => void;
}) {
  const isSpeaking = useSpeakingFor(member.id);
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
        <span
          className="member-name"
          style={roleColor ? { color: roleColor } : undefined}
        >
          {member.displayName}
        </span>
        {member.voiceChannelId && (
          <span className="member-voice">
            <Volume2 size={12} /> In voice
          </span>
        )}
      </div>
    </div>
  );
});

export function MemberList({ serverId, onMessageUser }: MemberListProps) {
  const { data: members, isLoading } = useMembers(serverId);
  const { data: roles } = useRoles(serverId);
  const { data: me } = useMe();
  const [profile, setProfile] = useState<Member | null>(null);

  const { online, offline } = useMemo(() => {
    const online: Member[] = [];
    const offline: Member[] = [];
    for (const m of members ?? []) {
      (m.online ? online : offline).push(m);
    }
    return { online, offline };
  }, [members]);

  // Highest-positioned colored role wins; the default gray counts as no color.
  const colorByUserId = useMemo(() => {
    const map = new Map<string, string>();
    const colored = [...(roles ?? [])]
      .filter((r) => r.color && r.color.toLowerCase() !== DEFAULT_ROLE_COLOR)
      .sort((a, b) => b.position - a.position);
    for (const role of colored) {
      for (const { userId } of role.assignments) {
        if (!map.has(userId)) map.set(userId, role.color);
      }
    }
    return map;
  }, [roles]);

  if (!serverId) return null;

  return (
    <aside className="member-list">
      {isLoading ? (
        <SkeletonRows rows={6} avatar />
      ) : (
        <>
          <div className="member-group-header">Online — {online.length}</div>
          {online.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              roleColor={colorByUserId.get(m.id)}
              onOpenProfile={setProfile}
            />
          ))}
          {offline.length > 0 && (
            <div className="member-group-header">
              Offline — {offline.length}
            </div>
          )}
          {offline.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              roleColor={colorByUserId.get(m.id)}
              onOpenProfile={setProfile}
            />
          ))}
        </>
      )}
      {profile && (
        <ProfileCard
          user={profile}
          isSelf={profile.id === me?.id}
          onMessage={onMessageUser}
          onClose={() => setProfile(null)}
        />
      )}
    </aside>
  );
}
