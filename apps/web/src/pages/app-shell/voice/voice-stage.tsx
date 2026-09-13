import { useState } from 'react';
import { Volume2, Users, MessageSquare, Tv } from 'lucide-react';
import { VoiceRoom } from './voice-room';
import { ChannelChat } from '../channel-view/channel-chat';
import { Tooltip } from '../../../components/tooltip';
import type { ActiveVoice } from '../use-app-shell';

type VoiceStageProps = {
  voice: ActiveVoice;
  chatOpen: boolean;
  membersOpen: boolean;
  onToggleChat: () => void;
  onToggleMembers: () => void;
};

export function VoiceStage({
  voice,
  chatOpen,
  membersOpen,
  onToggleChat,
  onToggleMembers,
}: VoiceStageProps) {
  const [watchOpen, setWatchOpen] = useState(false);
  return (
    <main className="content content-voice" data-lk-theme="default">
      <header className="content-header">
        <span className="channel-icon">
          <Volume2 size={20} />
        </span>
        <span className="content-title">{voice.name}</span>
        <div className="content-header-actions">
          <Tooltip label="Watch Together" side="bottom">
            <button
              className={`header-members-btn ${watchOpen ? 'header-btn-active' : ''}`}
              aria-label="Watch Together"
              onClick={() => setWatchOpen((w) => !w)}
            >
              <Tv size={20} />
            </button>
          </Tooltip>
          <Tooltip label="Toggle chat" side="bottom">
            <button
              className={`header-members-btn ${chatOpen ? 'header-btn-active' : ''}`}
              aria-label="Toggle chat"
              onClick={onToggleChat}
            >
              <MessageSquare size={20} />
            </button>
          </Tooltip>
          <Tooltip label="Toggle member list" side="bottom">
            <button
              className={`header-members-btn ${membersOpen ? 'header-btn-active' : ''}`}
              aria-label="Toggle member list"
              onClick={onToggleMembers}
            >
              <Users size={20} />
            </button>
          </Tooltip>
        </div>
      </header>
      <div className="voice-split-h">
        <div className="voice-video-area">
          <VoiceRoom channelId={voice.id} watchOpen={watchOpen} />
        </div>
        {chatOpen && (
          <div className="voice-chat-side">
            <ChannelChat channelId={voice.id} channelName={voice.name} />
          </div>
        )}
      </div>
    </main>
  );
}
