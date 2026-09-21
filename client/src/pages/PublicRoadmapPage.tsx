import { useParams } from 'react-router-dom';
import { usePublicRoadmap } from '../hooks/usePublicShare';
import StatusBadge from '../components/common/StatusBadge';
import { Skeleton, SkeletonLines } from '../components/common/Skeleton';

/**
 * Public, unauthenticated view of a course's planning tree.
 * Mounted outside RequireAuth at /share/roadmap/:token.
 */
export default function PublicRoadmapPage() {
  const { token = '' } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicRoadmap(token);

  if (isLoading) {
    return (
      <div className="public-shell">
        <header className="public-header">
          <div className="public-brand">
            <Skeleton height={28} width={28} radius="50%" />
            <Skeleton height={18} width={100} />
          </div>
          <div className="public-tag">
            <Skeleton height={20} width={130} radius="var(--radius-pill)" />
          </div>
        </header>
        <main className="public-main">
          <Skeleton height={32} width="50%" />
          <div style={{ marginTop: 12 }}>
            <Skeleton height={16} width="70%" />
          </div>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Skeleton height={22} width="35%" />
                  <Skeleton height={20} width={80} radius="var(--radius-pill)" />
                </div>
                <SkeletonLines lines={2} lastWidth="60%" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16 }}>
                  <Skeleton height={18} width="40%" />
                  <Skeleton height={18} width="30%" />
                </div>
              </div>
            ))}
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
        <div className="public-tag">Public roadmap</div>
      </header>
      <main className="public-main">
        <h1 className="public-title">{data.course.title}</h1>
        {data.course.description && <p className="public-subtitle">{data.course.description}</p>}

        {data.milestones.length === 0 && (
          <div className="public-empty">
            <p>No milestones yet.</p>
          </div>
        )}

        <ol className="public-roadmap">
          {data.milestones.map((m) => (
            <li key={m.id} className="public-roadmap-item">
              <div className="public-roadmap-head">
                <h2>{m.title}</h2>
                <StatusBadge status={m.status} />
              </div>
              {m.description && <p className="public-roadmap-desc">{m.description}</p>}
              {m.modules.length > 0 && (
                <ul className="public-modules">
                  {m.modules.map((mod) => (
                    <li key={mod.id} className="public-module">
                      <div className="public-module-head">
                        <strong>{mod.title}</strong>
                        <StatusBadge status={mod.status} />
                      </div>
                      {mod.description && <p className="public-roadmap-desc">{mod.description}</p>}
                      {mod.labGroups.length > 0 && (
                        <ul className="public-labgroups">
                          {mod.labGroups.map((g) => (
                            <li key={g.id} className="public-labgroup">
                              <div className="public-labgroup-head">
                                <span>{g.title}</span>
                                <StatusBadge status={g.status} />
                              </div>
                              {g.labs.length > 0 && (
                                <ul className="public-labs">
                                  {g.labs.map((l) => (
                                    <li key={l.id} className="public-lab">
                                      <span className="public-lab-title">{l.title}</span>
                                      <StatusBadge status={l.status} />
                                      {l.estimatedTime > 0 && (
                                        <span className="public-lab-time">
                                          ~{l.estimatedTime} min
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </main>
      <footer className="public-footer">Shared from Lab Planner — no account required.</footer>
    </div>
  );
}
