import { useTyping } from '../../../hooks/realtime/use-typing';
import './message-extras.css';

type TypingIndicatorProps = {
  channelId: string;
};

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  if (names.length === 3)
    return `${names[0]}, ${names[1]} and ${names[2]} are typing…`;
  return 'Several people are typing…';
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const typingNames = useTyping(channelId);
  if (typingNames.length === 0) return null;
  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span />
        <span />
        <span />
      </span>
      {typingText(typingNames)}
    </div>
  );
}
