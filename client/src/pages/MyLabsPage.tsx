import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyLabs } from '../hooks/useMyLabs';
import { useAuth } from '../hooks/useAuth';
import { useAcceptAssignment, useDeclineAssignment, useSubmitLab } from '../hooks/useLab';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';
import { MY_LAB_TABS, MY_LAB_TAB_LABELS, type MyLabTab } from '../utils/constants';
import { ROLE_LABELS, type Lab } from '../types/domain';
import { Skeleton } from '../components/common/Skeleton';

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleString();
}

function openStageCount(review: { status: string }[] | undefined): number {
  return (review ?? []).filter((s) => s.status === 'OPEN').length;
}

function LabRowActions({ lab, isMinion }: { lab: Lab; isMinion: boolean }) {
  const accept = useAcceptAssignment();
  const decline = useDeclineAssignment();
  const submit = useSubmitLab();
  const awaitingAcceptance =
    isMinion &&
    !!lab.assignedMinionId &&
    !lab.acceptedByMinionAt &&
    lab.status !== 'DONE';
  const canSubmit =
    isMinion && !!lab.acceptedByMinionAt && !!lab.assignedMinionId && lab.status !== 'DONE';

  if (awaitingAcceptance) {
    return (
      <div className="row" style={{ gap: 6 }}>
        <button
          type="button"
          className="chip primary"
          disabled={accept.isPending}
          onClick={() => accept.mutate(lab._id)}
          title="Accept this assignment so you can start working on it"
        >
          <span className="icon" aria-hidden="true">✅</span>
          <span>{accept.isPending ? 'Accepting…' : 'Accept'}</span>
        </button>
        <button
          type="button"
          className="chip"
          disabled={decline.isPending}
          onClick={() => {
            if (window.confirm('Decline this assignment? It will be returned for re-assignment.')) {
              decline.mutate(lab._id);
            }
          }}
          title="Decline this assignment"
        >
          <span className="icon" aria-hidden="true">↩️</span>
          <span>Decline</span>
        </button>
        <Link to={`/labs/${lab._id}`} className="chip">
          Open ›
        </Link>
      </div>
    );
  }

  return (
    <div className="row" style={{ gap: 6 }}>
      {canSubmit && (
        <button
          type="button"
          className="chip"
          disabled={submit.isPending}
          onClick={() => submit.mutate(lab._id)}
          title="Mark this lab as submitted for review"
        >
          <span className="icon" aria-hidden="true">📤</span>
          <span>{submit.isPending ? 'Submitting…' : 'Submit'}</span>
        </button>
      )}
      <Link to={`/labs/${lab._id}`} className="chip">
        Open ›
      </Link>
    </div>
  );
}

export default function MyLabsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<MyLabTab>('pending');
  const { data: labs, isLoading } = useMyLabs(tab);

  const isMinion = useMemo(() => user?.role === 'MINION', [user]);
  const isInstructor = useMemo(() => user?.role === 'INSTRUCTOR', [user]);

  // For instructor/coordinator/admin, the "awaiting acceptance" tab doesn't
  // really apply — hide it.
  const visibleTabs = useMemo<MyLabTab[]>(
    () => (isMinion ? [...MY_LAB_TABS] : MY_LAB_TABS.filter((t) => t !== 'awaiting')),
    [isMinion],
  );

  if (!user) return null;

  const subtitle = isMinion
    ? 'Labs assigned to you. Track what is awaiting acceptance, pending, in review, or finished.'
    : isInstructor
      ? 'Labs you have reviewed. Use the tabs to see what is still open or already accepted.'
      : 'All labs across the workspace, filtered by lifecycle stage.';

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">My Labs</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      <nav className="my-labs-tabs" aria-label="My Labs filters">
        {visibleTabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`my-labs-tab ${tab === t ? 'is-active' : ''}`}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
          >
            {MY_LAB_TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <div className="card skeleton-card" style={{ padding: 16 }}>
          <Skeleton height={16} width="30%" />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--color-border-soft)' }}
              >
                <Skeleton height={14} width="30%" />
                <Skeleton height={14} width={80} />
                <Skeleton height={14} width={80} />
                <Skeleton height={14} width={120} />
                <Skeleton height={14} width={120} />
                <Skeleton height={14} width={120} />
                <Skeleton height={14} width={120} />
                <Skeleton height={28} width={80} radius="var(--radius-pill)" />
              </div>
            ))}
          </div>
        </div>
      ) : !labs || labs.length === 0 ? (
        <EmptyState
          title={`No ${MY_LAB_TAB_LABELS[tab].toLowerCase()} labs`}
          description={
            tab === 'awaiting' && isMinion
              ? 'No new assignments waiting for you. Assigned labs show up here so you can accept them before starting work.'
              : tab === 'pending' && isMinion
                ? 'You have no pending labs right now. Wait for an instructor or coordinator to assign one.'
                : tab === 'finished' && isMinion
                  ? "You haven't finished any labs yet."
                  : tab === 'in_review' && isMinion
                    ? 'Nothing under review right now.'
                    : `No labs match the "${MY_LAB_TAB_LABELS[tab]}" filter.`
          }
          action={
            isMinion && (tab === 'pending' || tab === 'awaiting') ? (
              <Link className="button primary" to="/courses">
                Browse courses
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="card my-labs-table-wrap">
          <table className="my-labs-table">
            <thead>
              <tr>
                <th>Lab</th>
                <th>Status</th>
                <th>Open stages</th>
                <th>Assigned</th>
                <th>Accepted</th>
                <th>Submitted</th>
                <th>Updated</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {labs.map((l) => {
                const openStages = openStageCount(l.review);
                return (
                  <tr key={l._id}>
                    <td>
                      <Link to={`/labs/${l._id}`} className="my-labs-table__title">
                        {l.title}
                      </Link>
                    </td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      {openStages > 0 ? (
                        <span className="my-labs-table__pill my-labs-table__pill--warn">
                          {openStages} open
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="muted">{formatDate(l.assignedAt)}</td>
                    <td className="muted">{formatDate(l.acceptedByMinionAt)}</td>
                    <td className="muted">{formatDate(l.submittedAt)}</td>
                    <td className="muted">{formatDate(l.updatedAt)}</td>
                    <td>
                      <LabRowActions lab={l} isMinion={isMinion} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted" style={{ marginTop: 'var(--space-4)', fontSize: 12 }}>
        Showing as <strong>{ROLE_LABELS[user.role]}</strong>.
        {isMinion && ' You only see labs assigned to you. Use “Awaiting acceptance” to accept or decline new assignments.'}
        {isInstructor && ' You see labs where you opened a review stage.'}
      </p>
    </>
  );
}
