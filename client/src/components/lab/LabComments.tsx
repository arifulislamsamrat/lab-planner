import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { labApi } from '../../services/labApi';
import { toastError, showToast } from '../common/Toast';
import { useAuth } from '../../hooks/useAuth';
import type { Lab, LabComment } from '../../types/domain';

interface Props {
  labId: string;
  comments: LabComment[];
}

function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function LabComments({ labId, comments }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');

  const add = useMutation({
    mutationFn: (text: string) => labApi.addComment(labId, text),
    onSuccess: (c) => {
      qc.setQueryData<Lab | undefined>(['lab', labId], (prev) =>
        prev ? { ...prev, comments: [...(prev.comments ?? []), c] } : prev,
      );
      qc.invalidateQueries({ queryKey: ['lab', labId] });
      setBody('');
      showToast('Comment added');
    },
    onError: (e) => toastError(e),
  });
  const remove = useMutation({
    mutationFn: (commentId: string) => labApi.removeComment(labId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab', labId] });
      showToast('Comment deleted');
    },
    onError: (e) => toastError(e),
  });

  const sorted = [...(comments ?? [])].sort((a, b) => {
    const av = new Date(a.createdAt).getTime();
    const bv = new Date(b.createdAt).getTime();
    return order === 'newest' ? bv - av : av - bv;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t) return;
    add.mutate(t);
  }

  return (
    <div className="card comments-card mt-4">
      <div className="comments-header">
        <h3 style={{ margin: 0 }}>Comments</h3>
        <div className="md-mode-toggle" role="group" aria-label="Sort order">
          <button
            type="button"
            className={`md-mode-btn ${order === 'newest' ? 'is-active' : ''}`}
            onClick={() => setOrder('newest')}
          >
            Newest first
          </button>
          <button
            type="button"
            className={`md-mode-btn ${order === 'oldest' ? 'is-active' : ''}`}
            onClick={() => setOrder('oldest')}
          >
            Oldest first
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="muted">No comments yet. Be the first to leave one.</p>
      ) : (
        <div className="comments-list">
          {sorted.map((c) => {
            const isAuthor = user && user.id === c.userId;
            const isAdmin = user && user.role === 'ADMIN';
            const canDelete = isAuthor || isAdmin;
            return (
              <div key={c._id} className="comment">
                <span className="comment-avatar" aria-hidden="true">{initialsOf(c.userName)}</span>
                <div className="comment-content">
                  <div className="comment-meta">
                    <strong>{c.userName}</strong>
                    <span className="comment-dot">·</span>
                    <span>{relativeTime(c.createdAt)}</span>
                  </div>
                  <div className="comment-body">{c.body}</div>
                </div>
                {canDelete && (
                  <button
                    className="button ghost sm comment-delete"
                    title="Delete comment"
                    onClick={() => remove.mutate(c._id)}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          className="textarea"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave a comment…"
          maxLength={2000}
        />
        <div className="modal-footer">
          <button type="submit" className="button primary" disabled={!body.trim() || add.isPending}>
            {add.isPending ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
