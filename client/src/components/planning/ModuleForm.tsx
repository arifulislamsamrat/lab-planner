import { useState } from 'react';
import type { ModuleEntity } from '../../types/domain';

interface Props {
  initial?: Partial<ModuleEntity>;
  onSubmit: (payload: Partial<ModuleEntity>) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function ModuleForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setError('Title is required');
    onSubmit({ title: t, description: description.trim() });
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
      <div className="modal-footer">
        <button type="button" className="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? 'Saving...' : initial?._id ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}