import { useState, KeyboardEvent } from 'react';

type MessageComposerProps = {
  channelName: string;
  onSend: (content: string) => void;
};

export function MessageComposer({ channelName, onSend }: MessageComposerProps) {
  const [draft, setDraft] = useState('');

  function submit() {
    const content = draft.trim();
    if (!content) return;
    onSend(content);
    setDraft('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer">
      <textarea
        className="composer-input"
        rows={1}
        placeholder={`Message #${channelName}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
