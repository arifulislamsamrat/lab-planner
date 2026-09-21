import { useParams } from 'react-router-dom';
import { usePublicReadme } from '../hooks/usePublicShare';
import { Skeleton, SkeletonLines } from '../components/common/Skeleton';

/**
 * Public, unauthenticated view of a lab's readme.
 * Mounted outside RequireAuth at /share/readme/:token.
 */
export default function PublicReadmePage() {
  const { token = '' } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicReadme(token);

  if (isLoading) {
    return (
      <div className="public-shell">
        <header className="public-header">
          <div className="public-brand">
            <Skeleton height={28} width={28} radius="50%" />
            <Skeleton height={18} width={100} />
          </div>
          <div className="public-tag">
            <Skeleton height={20} width={110} radius="var(--radius-pill)" />
          </div>
        </header>
        <main className="public-main">
          <Skeleton height={32} width="60%" />
          <div style={{ marginTop: 12 }}>
            <Skeleton height={16} width={120} />
          </div>
          <div style={{ marginTop: 24 }}>
            <SkeletonLines lines={10} lastWidth="80%" />
          </div>
        </main>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="public-shell">
        <div className="public-empty">
          <h1>Link not found</h1>
          <p>This share link is invalid or has been revoked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-brand">
          <img
            src="https://s3.brilliant.com.bd/blog-bucket/thumbnail/8c5225dc-da97-48ab-9736-37d815e14439.png"
            alt="Lab Planner"
            className="public-brand-logo"
          />
          <span className="public-brand-text">Lab Planner</span>
        </div>
        <div className="public-tag">Public readme</div>
      </header>
      <main className="public-main">
        <h1 className="public-title">{data.title}</h1>
        {data.sourceLink && (
          <p className="public-source-link">
            <a href={data.sourceLink} target="_blank" rel="noopener noreferrer">
              Open source ↗
            </a>
          </p>
        )}
        <article
          className="markdown public-markdown"
          // Server-rendered HTML, never user-controlled in this branch (the
          // server already passes it through `marked` which escapes by default).
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      </main>
      <footer className="public-footer">
        Shared from Lab Planner — no account required.
      </footer>
    </div>
  );
}
