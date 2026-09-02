import { useContinueAsGuest } from '../../hooks/auth/use-continue-as-guest';
import { useLogin } from '../../hooks/auth/use-login';
import { useRegister } from '../../hooks/auth/use-register';

function errorMessage(err: unknown): string | null {
  if (!err) return null;
  return err instanceof Error ? err.message : 'Something went wrong';
}

export function useLandingPage() {
  const guest = useContinueAsGuest();
  const login = useLogin();
  const register = useRegister();

  return {
    guest: {
      submit: (displayName: string) => guest.mutate(displayName),
      isPending: guest.isPending,
      error: errorMessage(guest.error),
    },
    login: {
      submit: login.mutate,
      isPending: login.isPending,
      error: errorMessage(login.error),
    },
    register: {
      submit: register.mutate,
      isPending: register.isPending,
      error: errorMessage(register.error),
    },
  };
}
