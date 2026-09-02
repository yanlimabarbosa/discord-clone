import { useNavigate, useParams } from 'react-router-dom';
import { useMe } from '../../hooks/auth/use-me';
import { useContinueAsGuest } from '../../hooks/auth/use-continue-as-guest';
import { useInvitePreview } from '../../hooks/invites/use-invite-preview';
import { useJoinInvite } from '../../hooks/invites/use-join-invite';

export function useInvitePage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const preview = useInvitePreview(code);
  const { data: user } = useMe();
  const guest = useContinueAsGuest();
  const join = useJoinInvite();

  async function acceptAsUser() {
    await join.mutateAsync(code);
    navigate('/');
  }

  async function acceptAsGuest(nickname: string) {
    await guest.mutateAsync(nickname);
    await join.mutateAsync(code);
    navigate('/');
  }

  return {
    serverName: preview.data?.server.name ?? null,
    invalid: preview.isError,
    loading: preview.isLoading,
    isLoggedIn: !!user,
    userName: user?.displayName ?? null,
    joining: join.isPending || guest.isPending,
    error: (join.error ?? guest.error) instanceof Error
      ? (join.error ?? guest.error)!.message
      : null,
    acceptAsUser,
    acceptAsGuest,
    goHome: () => navigate('/'),
  };
}
