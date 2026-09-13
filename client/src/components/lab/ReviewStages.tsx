import { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useOpenReview, useResolveReview, useAcceptLab } from '../../hooks/useLab';
import { REVIEWER_ROLES } from '../../utils/constants';
import type { Lab } from '../../types/domain';

interface Props {
  lab: Lab;
}

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString();
}

export default function ReviewStages({ lab }: Props) {
  const { user } = useAuth();
  const openReview = useOpenReview();
  const resolveReview = useResolveReview();
  const acceptLab = useAcceptLab();
  const [feedback, setFeedback] = useState('');
  const [showOpen, setShowOpen] = useState(false);

  const isReviewer = !!user && REVIEWER_ROLES.includes(user.role as never);
  const stages = [...(lab.review ?? [])].sort((a, b) => b.stage - a.stage);
  const hasOpenStage = stages.some((s) => s.status === 'OPEN');
  const allResolved = stages.length > 0 && stages.every((s) => s.status === 'RESOLVED');
  const canAccept =
    isReviewer &&
    (lab.status === 'REVIEW') &&
    (stages.length === 0 ? false : allResolved);

  function submitFeedback() {
    if (!feedback.trim()) return;
    openReview.mutate(
      { labId: lab._id, feedback: feedback.trim() },
      {
        onSuccess: () => {
          setFeedback('');
          setShowOpen(false);
        },
      },
    );
  }

  return (
    <section className="review-stages">
      <header className="review-stages__head">
        <h2 className="review-stages__title">Review stages</h2>
        {isReviewer && (
          <div className="review-stages__actions">
            {canAccept && (
              <button
                type="button"
                className="button primary small"
                onClick={() => acceptLab.mutate(lab._id)}
                disabled={acceptLab.isPending}
                title="Mark this lab as Done"
              >
                ✓ Accept lab
              </button>
            )}
            {!showOpen && (
              <button
                type="button"
                className="button small"
                onClick={() => setShowOpen(true)}
                disabled={!isReviewer}
              >
                {hasOpenStage ? '+ Add stage' : '+ Open review stage'}
              </button>
            )}
          </div>
        )}
      </header>

      {showOpen && isReviewer && (
        <div className="review-stages__compose">
          <label htmlFor={`feedback-${lab._id}`} className="review-stages__compose-label">
            Feedback for this stage
          </label>
          <textarea
            id={`feedback-${lab._id}`}
            className="textarea"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What needs to change before this lab is accepted?"
          />
          <div className="review-stages__compose-actions">
            <button
              type="button"
              className="button ghost small"
              onClick={() => {
                setShowOpen(false);
                setFeedback('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary small"
              onClick={submitFeedback}
              disabled={!feedback.trim() || openReview.isPending}
            >
              {openReview.isPending ? 'Opening…' : 'Open stage'}
            </button>
          </div>
        </div>
      )}

      {stages.length === 0 ? (
        <p className="muted review-stages__empty">
          No review stages yet.
          {isReviewer ? ' Open one above to start the review.' : ' An instructor will open a stage when reviewing your work.'}
        </p>
      ) : (
        <ol className="review-timeline">
          {stages.map((s) => (
            <li
              key={s._id}
              className={`review-stage review-stage--${s.status.toLowerCase()}`}
            >
              <div className="review-stage__badge" aria-hidden>
                <span className="review-stage__stage-num">#{s.stage}</span>
                <StatusBadge status={s.status} />
              </div>
              <div className="review-stage__body">
                <div className="review-stage__meta">
                  <span className="review-stage__reviewer">{s.reviewerName}</span>
                  <span className="muted">
                    opened {formatDate(s.openedAt)}
                    {s.resolvedAt && ` · resolved ${formatDate(s.resolvedAt)}`}
                  </span>
                </div>
                {s.feedback && <blockquote className="review-stage__feedback">{s.feedback}</blockquote>}
                {isReviewer && s.status === 'OPEN' && (
                  <div className="review-stage__actions">
                    <button
                      type="button"
                      className="button small"
                      onClick={() => resolveReview.mutate({ labId: lab._id, stageId: s._id })}
                      disabled={resolveReview.isPending}
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {lab.submittedAt && (
        <p className="muted review-stages__submitted">
          Minion submitted {formatDate(lab.submittedAt)}
          {lab.acceptedAt && ` · accepted ${formatDate(lab.acceptedAt)}`}
        </p>
      )}
    </section>
  );
}
