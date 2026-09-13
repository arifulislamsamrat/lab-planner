import { useState } from 'react';
import { COURSE_STATUSES, COURSE_STATUS_LABELS } from '../../utils/constants';
import type { Course } from '../../types/domain';

interface Props {
  initial?: Partial<Course>;
  onSubmit: (payload: Partial<Course>) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function CourseForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<Course['status']>(initial?.status ?? 'DRAFT');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setError('Title is required');
    onSubmit({ title: t, description: description.trim(), status });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        {error && <span className="error">{error}</span>}
      </div>
      <div className="field">
        <label>Description</label>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Status</label>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as Course['status'])}>
          {COURSE_STATUSES.map((s) => <option key={s} value={s}>{COURSE_STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <div className="modal-footer">
        <button type="button" className="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? 'Saving...' : initial?._id ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}