import { VoiceRoom } from './voice-room';
import type { ActiveVoice } from '../use-app-shell';

type VoiceStageProps = {
  voice: ActiveVoice;
};

export function VoiceStage({ voice }: VoiceStageProps) {
  return (
    <main className="content content-voice" data-lk-theme="default">
      <header className="content-header">
        <span className="channel-icon">🔊</span>
        <span className="content-title">{voice.name}</span>
      </header>
      <VoiceRoom />
    </main>
  );
}
