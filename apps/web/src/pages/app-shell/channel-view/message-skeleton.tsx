import './message-skeleton.css';

const ROWS = [70, 45, 85, 55, 60, 40];

export function MessageSkeleton() {
  return (
    <div className="msg-skeleton" aria-hidden="true">
      {ROWS.map((width, i) => (
        <div className="msg-skeleton-row" key={i}>
          <div className="msg-skeleton-avatar" />
          <div className="msg-skeleton-body">
            <div className="msg-skeleton-name" />
            <div className="msg-skeleton-line" style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
