import {
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { ImagePlus } from 'lucide-react';
import { AttachmentTray } from '../../../components/attachment-tray';
import {
  imageFilesFromClipboard,
  useComposerAttachments,
} from '../../../hooks/uploads/use-composer-attachments';
import type { UploadedAttachment } from '../../../hooks/uploads/use-upload-attachment';

type MessageComposerProps = {
  channelName: string;
  onSend: (content: string, attachments: UploadedAttachment[]) => void;
  onTyping?: () => void;
};

export function MessageComposer({
  channelName,
  onSend,
  onTyping,
}: MessageComposerProps) {
  const [draft, setDraft] = useState('');
  const attach = useComposerAttachments();
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    const content = draft.trim();
    if (!content && attach.ready.length === 0) return;
    if (attach.anyUploading) return;
    onSend(content, attach.ready);
    setDraft('');
    attach.clear();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = imageFilesFromClipboard(e.clipboardData);
    if (files.length) {
      e.preventDefault();
      attach.addFiles(files);
    }
  }

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (files.length) attach.addFiles(files);
    e.target.value = '';
  }

  return (
    <div className="composer">
      <AttachmentTray items={attach.items} onRemove={attach.remove} />
      <div className="composer-row">
        <button
          type="button"
          className="composer-attach"
          title="Attach image"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus size={20} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onPickFiles}
        />
        <textarea
          className="composer-input"
          rows={1}
          placeholder={`Message #${channelName}`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value) onTyping?.();
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
      </div>
    </div>
  );
}
