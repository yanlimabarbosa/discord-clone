import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import './message-attachment.css';

type MessageAttachmentProps = {
  url: string;
};

type LoadState = 'loading' | 'ready' | 'error';

export function MessageAttachment({ url }: MessageAttachmentProps) {
  const [state, setState] = useState<LoadState>('loading');

  if (state === 'error') {
    return (
      <div className="message-attachment-failed">
        <ImageOff size={16} />
        <span>Attachment failed to load</span>
      </div>
    );
  }

  return (
    <div
      className={`message-attachment${state === 'loading' ? ' is-loading' : ''}`}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          src={url}
          alt="attachment"
          loading="lazy"
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      </a>
    </div>
  );
}
