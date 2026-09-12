import { useState, FormEvent } from 'react';
import { useAddFriend } from '../../../hooks/friends/use-add-friend';
import { ApiError } from '../../../lib/api-client';

export function AddFriendForm() {
  const addFriend = useAddFriend();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = username.trim();
    if (!value) return;
    setError(null);
    setOk(false);
    try {
      await addFriend.mutateAsync(value);
      setOk(true);
      setUsername('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="add-friend">
      <h3 className="add-friend-title">Add Friend</h3>
      <p className="add-friend-hint">
        You can add friends with their username.
      </p>
      <form className="add-friend-form" onSubmit={onSubmit}>
        <input
          className="add-friend-input"
          placeholder="Enter a username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
            setOk(false);
          }}
        />
        <button
          className="add-friend-submit"
          type="submit"
          disabled={!username.trim() || addFriend.isPending}
        >
          Send Request
        </button>
      </form>
      {error && <div className="add-friend-error">{error}</div>}
      {ok && <div className="add-friend-ok">Friend request sent!</div>}
    </div>
  );
}
