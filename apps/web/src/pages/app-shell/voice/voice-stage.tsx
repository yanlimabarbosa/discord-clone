import { VoiceRoom } from './voice-room';
import { ChannelChat } from '../channel-view/channel-chat';
import type { ActiveVoice } from '../use-app-shell';

type VoiceStageProps = {
  voice: ActiveVoice;
  onToggleMembers: () => void;
};

export function VoiceStage({ voice, onToggleMembers }: VoiceStageProps) {
  return (
    <main className="content content-voice" data-lk-theme="default">
      <header className="content-header">
        <span className="channel-icon">🔊</span>
        <span className="content-title">{voice.name}</span>
        <button
          className="header-members-btn"
          title="Toggle member list"
          onClick={onToggleMembers}
        >
          👥
        </button>
      </header>
      <div className="voice-split">
        <div className="voice-stage-video">
          <VoiceRoom />
        </div>
        <div className="voice-stage-chat">
          <ChannelChat channelId={voice.id} channelName={voice.name} />
        </div>
      </div>
    </main>
  );
}
