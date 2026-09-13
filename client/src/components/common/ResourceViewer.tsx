import { useEffect, useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { labApi } from '../../services/labApi';
import { extractErrorMessage } from '../../services/apiClient';

interface Props {
  open: boolean;
  labId: string;
  title: string;
  onClose: () => void;
}

export default function ResourceViewer({ open, labId, title, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string>('');
  const [requestedUrl, setRequestedUrl] = useState<string>('');
  const [fetchedUrl, setFetchedUrl] = useState<string>('');
  const [source, setSource] = useState<'link' | 'inline' | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setHtml('');
    labApi.getResource(labId)
      .then((res) => {
        setHtml(res.html);
        setRequestedUrl(res.requestedUrl);
        setFetchedUrl(res.fetchedUrl);
        setSource(res.source);
      })
      .catch((err) => setError(extractErrorMessage(err, 'Could not load resource')))
      .finally(() => setLoading(false));
  }, [open, labId]);

  return (
    <Modal open={open} title={`Resource — ${title}`} onClose={onClose} wide>
      {loading && <Spinner label="Loading resource..." />}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <>
          <p className="muted mb-3" style={{ fontSize: 12 }}>
            {source === 'inline'
              ? 'Rendered from pasted README.'
              : source === 'link'
                ? 'Rendered from linked markdown file.'
                : ''}
          </p>
          {source === 'link' && requestedUrl && requestedUrl !== fetchedUrl && (
            <p className="muted mb-3" style={{ fontSize: 12 }}>
              Rewrote <code>{requestedUrl}</code> → <code>{fetchedUrl}</code>
            </p>
          )}
          <div
            className="resource-content"
            // server-rendered markdown; safe because we control the source
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </>
      )}
    </Modal>
  );
}
