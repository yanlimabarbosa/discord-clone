import { useState } from 'react';

type JoinState = {
  token: string;
  error: string;
  connecting: boolean;
};

export function useJoinRoom() {
  const [state, setState] = useState<JoinState>({
    token: '',
    error: '',
    connecting: false,
  });

  async function join(room: string, identity: string) {
    setState({ token: '', error: '', connecting: true });
    try {
      const res = await fetch(
        `/token?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(identity)}`,
      );
      if (!res.ok) throw new Error(`token request failed (${res.status})`);
      const data = (await res.json()) as { token: string };
      setState({ token: data.token, error: '', connecting: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      setState({ token: '', error: message, connecting: false });
    }
  }

  function leave() {
    setState({ token: '', error: '', connecting: false });
  }

  return { ...state, join, leave };
}
