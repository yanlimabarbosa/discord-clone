import './avatar.css';

type AvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, avatarUrl, size = 32, className }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.45),
  };
  const rootClass = `ui-avatar${className ? ` ${className}` : ''}`;

  if (avatarUrl) {
    return (
      <div className={rootClass} style={style}>
        <img src={avatarUrl} alt={name} className="ui-avatar-img" />
      </div>
    );
  }

  return (
    <div className={rootClass} style={style}>
      {initial}
    </div>
  );
}
