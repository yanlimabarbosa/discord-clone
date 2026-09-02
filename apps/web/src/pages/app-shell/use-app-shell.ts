import { useMe } from '../../hooks/auth/use-me';
import { useLogout } from '../../hooks/auth/use-logout';

export function useAppShell() {
  const { data: user } = useMe();
  const logout = useLogout();

  return {
    user,
    logout: () => logout.mutate(),
    loggingOut: logout.isPending,
  };
}
