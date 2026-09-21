interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
  /** Inline style overrides if you need more than width/height. */
  style?: React.CSSProperties;
}

/**
 * Animated shimmering placeholder used while content loads.
 * Colors come from design tokens so it adapts to light/dark themes.
 */
export function Skeleton({ width = '100%', height = 14, radius, className, style }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className ?? ''}`}
      style={{
        display: 'block',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/** A stack of skeleton lines (for paragraph placeholders). */
export function SkeletonLines({ lines = 3, lastWidth = '60%' }: { lines?: number; lastWidth?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? lastWidth : '100%'}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton — generic page content placeholder. */
export function SkeletonCard({ height: _height = 160 }: { height?: number | string }) {
  return (
    <div className="card skeleton-card">
      <Skeleton height={18} width="40%" />
      <div style={{ marginTop: 16 }}>
        <SkeletonLines lines={3} />
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Skeleton height={32} width={96} radius="var(--radius-md)" />
        <Skeleton height={32} width={96} radius="var(--radius-md)" />
      </div>
    </div>
  );
}

/** Stat tile skeleton — used in dashboards. */
export function SkeletonStat() {
  return (
    <div className="stat skeleton-stat">
      <Skeleton height={10} width="50%" />
      <div style={{ marginTop: 12 }}>
        <Skeleton height={28} width="40%" />
      </div>
    </div>
  );
}

/** Row skeleton — for tables and lists. */
export function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="skeleton-row" style={{ display: 'flex', gap: 16, padding: '12px 0' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === 0 ? '40%' : `${80 / columns}%`} />
      ))}
    </div>
  );
}

/** Page header skeleton — title + subtitle + action buttons. */
export function SkeletonPageHeader() {
  return (
    <div className="skeleton-page-header">
      <Skeleton height={28} width="30%" />
      <div style={{ marginTop: 8 }}>
        <Skeleton height={14} width="60%" />
      </div>
    </div>
  );
}
