import './message-row.css';

type MessageDayDividerProps = {
  label: string;
};

export function MessageDayDivider({ label }: MessageDayDividerProps) {
  return (
    <div className="message-day-divider" role="separator">
      <span>{label}</span>
    </div>
  );
}
