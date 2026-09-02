import { useState } from 'react';

type JoinFormProps = {
  connecting: boolean;
  error: string;
  onJoin: (room: string, identity: string) => void;
};

export function JoinForm({ connecting, error, onJoin }: JoinFormProps) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const canJoin = name.trim() !== '' && room.trim() !== '' && !connecting;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Video POC</h1>
        <p style={styles.subtitle}>Pick a name and a room. Share the room name with a friend.</p>
        <input
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button
          style={{ ...styles.button, opacity: canJoin ? 1 : 0.5 }}
          disabled={!canJoin}
          onClick={() => onJoin(room.trim(), name.trim())}
        >
          {connecting ? 'Connecting…' : 'Join'}
        </button>
        {error !== '' && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#1a1b1e',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: 320,
    padding: 32,
    borderRadius: 12,
    background: '#25262b',
    color: '#fff',
  },
  title: { margin: 0, fontSize: 24 },
  subtitle: { margin: 0, fontSize: 13, color: '#a1a1aa' },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #3f3f46',
    background: '#1a1b1e',
    color: '#fff',
    fontSize: 14,
  },
  button: {
    padding: '10px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#5865f2',
    color: '#fff',
    fontSize: 15,
    cursor: 'pointer',
  },
  error: { margin: 0, color: '#f87171', fontSize: 13 },
};
