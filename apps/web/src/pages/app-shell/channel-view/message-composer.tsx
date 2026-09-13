import {
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { ImagePlus, SendHorizontal, LoaderCircle, Smile } from 'lucide-react';
import { AttachmentTray } from '../../../components/attachment-tray';
import { EmojiPickerButton } from '../../../components/emoji-picker-button';
import { Tooltip } from '../../../components/tooltip';
import {
  imageFilesFromClipboard,
  useComposerAttachments,
} from '../../../hooks/uploads/use-composer-attachments';
import type { UploadedAttachment } from '../../../hooks/uploads/use-upload-attachment';

type MessageComposerProps = {
  channelName: string;
  sending?: boolean;
  onSend: (content: string, attachments: UploadedAttachment[]) => void;
  onTyping?: () => void;
};

export function MessageComposer({
  channelName,
  sending = false,
  onSend,
  onTyping,
}: MessageComposerProps) {
  const [draft, setDraft] = useState('');
  const attach = useComposerAttachments();
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend =
    (draft.trim().length > 0 || attach.ready.length > 0) && !attach.anyUploading;

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

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    if (!el) {
      setDraft((d) => d + emoji);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? start;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="composer">
      <AttachmentTray items={attach.items} onRemove={attach.remove} />
      <div className="composer-row">
        <Tooltip label="Attach image">
          <button
            type="button"
            className="composer-attach"
            aria-label="Attach image"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={20} />
          </button>
        </Tooltip>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onPickFiles}
        />
        <textarea
          ref={inputRef}
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
        <EmojiPickerButton
          label="Add emoji"
          icon={<Smile size={20} />}
          buttonClassName="composer-attach"
          pickerClassName="emoji-picker-up"
          onPick={insertEmoji}
        />
        <Tooltip label="Send message">
          <button
            type="button"
            className="composer-send"
            aria-label="Send message"
            disabled={!canSend}
            onClick={submit}
          >
            {sending ? (
              <LoaderCircle size={20} className="composer-spin" />
            ) : (
              <SendHorizontal size={20} />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
