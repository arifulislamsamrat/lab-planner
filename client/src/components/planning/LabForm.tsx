import { useEffect, useState } from 'react';
import { LAB_STATUSES, LAB_STATUS_LABELS } from '../../utils/constants';
import type { Lab } from '../../types/domain';

type MdMode = 'link' | 'paste';

interface Props {
  initial?: Partial<Lab>;
  onSubmit: (payload: Partial<Lab>) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function LabForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [estimatedTime, setEstimatedTime] = useState<number>(initial?.estimatedTime ?? 30);
  const [status, setStatus] = useState<Lab['status']>(initial?.status ?? 'BACKLOG');
  const [mdLink, setMdLink] = useState(initial?.mdLink ?? '');
  const [mdContent, setMdContent] = useState(initial?.mdContent ?? '');
  const [sourceLink, setSourceLink] = useState(initial?.sourceLink ?? '');

  // Default mode: link if there's a link, otherwise paste if there's content,
  // otherwise link.
  const [mdMode, setMdMode] = useState<MdMode>(() => {
    if ((initial?.mdLink ?? '').trim()) return 'link';
    if ((initial?.mdContent ?? '').trim()) return 'paste';
    return 'link';
  });

  const [error, setError] = useState<string | null>(null);

  // When switching modes, clear out the unused field so the user sees a clean slate.
  useEffect(() => {
    if (mdMode === 'link') setMdContent('');
    else setMdLink('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mdMode]);

  function isValidUrl(s: string) {
    if (!s) return true;
    try { new URL(s); return true; } catch { return false; }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setError('Title is required');
    if (!isValidUrl(mdLink.trim())) return setError('MD link must be a valid URL (or empty)');
    if (!isValidUrl(sourceLink.trim())) return setError('Source link must be a valid URL (or empty)');
    onSubmit({
      title: t,
      description: description.trim(),
      instructions: instructions.trim(),
      estimatedTime: Number(estimatedTime) || 0,
      status,
      mdLink: mdLink.trim(),
      mdContent: mdContent,
      sourceLink: sourceLink.trim(),
    });
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
        <label>Instructions</label>
        <textarea className="textarea" rows={5} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="1. Step one&#10;2. Step two" />
      </div>
      <div className="field">
        <label>Estimated Time (minutes)</label>
        <input
          className="input"
          type="number"
          min={0}
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label>Status</label>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as Lab['status'])}>
          {LAB_STATUSES.map((s) => <option key={s} value={s}>{LAB_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Resource source</label>
        <div className="md-mode-toggle" role="tablist" aria-label="MD source">
          <button
            type="button"
            role="tab"
            aria-selected={mdMode === 'link'}
            className={`md-mode-btn ${mdMode === 'link' ? 'is-active' : ''}`}
            onClick={() => setMdMode('link')}
          >
            🔗 Link
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mdMode === 'paste'}
            className={`md-mode-btn ${mdMode === 'paste' ? 'is-active' : ''}`}
            onClick={() => setMdMode('paste')}
          >
            📋 Paste README
          </button>
        </div>
      </div>

      {mdMode === 'link' ? (
        <div className="field">
          <label>MD Link <span className="muted">(optional — markdown URL to render in-app)</span></label>
          <input
            className="input"
            type="url"
            value={mdLink}
            onChange={(e) => setMdLink(e.target.value)}
            placeholder="https://raw.githubusercontent.com/user/repo/main/README.md"
          />
          <span className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            GitHub blob URLs are automatically rewritten to the raw form.
          </span>
        </div>
      ) : (
        <div className="field">
          <label>Paste full README <span className="muted">(optional — markdown content rendered directly)</span></label>
          <textarea
            className="textarea md-content-input"
            rows={10}
            value={mdContent}
            onChange={(e) => setMdContent(e.target.value)}
            placeholder={'# Title\n\nPaste the entire README here — headings, code blocks, lists all work.'}
          />
          <span className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            {(mdContent.length / 1024).toFixed(1)} KB · up to ~200 KB
          </span>
        </div>
      )}

      <div className="field">
        <label>Source Link <span className="muted">(optional — opens in new tab)</span></label>
        <input
          className="input"
          type="url"
          value={sourceLink}
          onChange={(e) => setSourceLink(e.target.value)}
          placeholder="https://github.com/user/repo"
        />
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
