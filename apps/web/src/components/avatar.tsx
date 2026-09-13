import { useState } from 'react';
import { userColor } from '../lib/user-color';
import './avatar.css';

type AvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, avatarUrl, size = 32, className }: AvatarProps) {
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const initial = name?.charAt(0).toUpperCase() || '?';
  const showImg = !!avatarUrl && avatarUrl !== brokenUrl;
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.45),
    background: showImg ? undefined : userColor(name),
  };
  const rootClass = `ui-avatar${className ? ` ${className}` : ''}`;

  if (showImg) {
    return (
      <div className={rootClass} style={style}>
        <img
          src={avatarUrl}
          alt={name}
          className="ui-avatar-img"
          onError={() => setBrokenUrl(avatarUrl)}
        />
      </div>
    );
  }

  return (
    <div className={rootClass} style={style}>
      {initial}
    </div>
  );
}
