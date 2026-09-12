import { X } from 'lucide-react';
import type { StagedAttachment } from '../hooks/uploads/use-composer-attachments';
import './attachment-tray.css';

type AttachmentTrayProps = {
  items: StagedAttachment[];
  onRemove: (id: string) => void;
};

export function AttachmentTray({ items, onRemove }: AttachmentTrayProps) {
  if (items.length === 0) return null;
  return (
    <div className="attach-tray">
      {items.map((it) => (
        <div
          key={it.id}
          className={`attach-thumb ${it.error ? 'attach-error' : ''}`}
        >
          <img src={it.previewUrl} alt="attachment" />
          {it.uploading && <div className="attach-spinner" />}
          {it.error && <div className="attach-err-label">failed</div>}
          <button
            className="attach-remove"
            title="Remove"
            onClick={() => onRemove(it.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
