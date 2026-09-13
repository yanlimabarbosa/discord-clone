import './skeletons.css';

type SkeletonRowsProps = {
  rows?: number;
  avatar?: boolean;
  avatarSize?: number;
};

// Bar widths cycle so the placeholder list doesn't look like a solid block.
const BAR_WIDTHS = ['70%', '45%', '60%', '52%', '66%'];

export function SkeletonRows({
  rows = 5,
  avatar = false,
  avatarSize = 32,
}: SkeletonRowsProps) {
  return (
    <div className="skeleton-rows" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row">
          {avatar && (
            <div
              className="skeleton-row-avatar"
              style={{ width: avatarSize, height: avatarSize }}
            />
          )}
          <div
            className="skeleton-row-bar"
            style={{ width: BAR_WIDTHS[i % BAR_WIDTHS.length] }}
          />
        </div>
      ))}
    </div>
  );
}
