import { useState } from 'react';
import { Volume2, Users, MessageSquare } from 'lucide-react';
import { VoiceRoom } from './voice-room';
import { ChannelChat } from '../channel-view/channel-chat';
import type { ActiveVoice } from '../use-app-shell';

type VoiceStageProps = {
  voice: ActiveVoice;
  onToggleMembers: () => void;
};

export function VoiceStage({ voice, onToggleMembers }: VoiceStageProps) {
  const [showChat, setShowChat] = useState(true);

  return (
    <main className="content content-voice" data-lk-theme="default">
      <header className="content-header">
        <span className="channel-icon">
          <Volume2 size={20} />
        </span>
        <span className="content-title">{voice.name}</span>
        <div className="content-header-actions">
          <button
            className={`header-members-btn ${showChat ? 'header-btn-active' : ''}`}
            title="Toggle chat"
            onClick={() => setShowChat((s) => !s)}
          >
            <MessageSquare size={20} />
          </button>
          <button
            className="header-members-btn"
            title="Toggle member list"
            onClick={onToggleMembers}
          >
            <Users size={20} />
          </button>
        </div>
      </header>
      <div className="voice-split-h">
        <div className="voice-video-area">
          <VoiceRoom />
        </div>
        {showChat && (
          <div className="voice-chat-side">
            <ChannelChat channelId={voice.id} channelName={voice.name} />
          </div>
        )}
      </div>
    </main>
  );
}
