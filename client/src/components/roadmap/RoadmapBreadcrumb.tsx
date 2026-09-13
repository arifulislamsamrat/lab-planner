import type { BreadcrumbSegment } from './types';

interface Props {
  segments: BreadcrumbSegment[];
  onJumpTo: (levelIdx: number) => void;
}

export default function RoadmapBreadcrumb({ segments, onJumpTo }: Props) {
  if (segments.length === 0) return null;
  return (
    <nav className="roadmap-breadcrumb" aria-label="Roadmap navigation">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={`${seg.levelIdx}-${seg.label}`} className="roadmap-breadcrumb__seg-wrap">
            {i > 0 && <span className="roadmap-breadcrumb__sep" aria-hidden>/</span>}
            {isLast ? (
              <span
                className="roadmap-breadcrumb__seg is-current"
                aria-current="page"
              >
                {seg.label}
              </span>
            ) : (
              <button
                type="button"
                className="roadmap-breadcrumb__seg"
                onClick={() => onJumpTo(seg.levelIdx)}
              >
                {seg.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
