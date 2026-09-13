import './skeletons.css';

type SkeletonCirclesProps = {
  count?: number;
  size?: number;
};

export function SkeletonCircles({ count = 4, size = 48 }: SkeletonCirclesProps) {
  return (
    <div className="skeleton-circles" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="skeleton-circle"
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}
