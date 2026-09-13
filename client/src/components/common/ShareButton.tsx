import { useState } from 'react';
import Modal from './Modal';
import { useCreateShare, useRevokeShare, useSharesForRef } from '../../hooks/useShares';
import { showToast, toastError } from './Toast';
import type { Share, ShareKind } from '../../services/shareApi';

interface Props {
  kind: ShareKind;
  refId: string;
  /**
   * Button label. Different per role:
   *   - "Share lab view" for ADMIN / COURSE_COORDINATOR / INSTRUCTOR
   *   - "Share readme" for MINION
   *   - "Share roadmap" for course-level shares
   */
  label: string;
  /** Optional small description shown above the link list. */
  description?: string;
}

function buildShareUrl(token: string, kind: ShareKind): string {
  // Public pages live at /share/<readme|roadmap>/:token. The token kind determines
  // which page we deep-link to. base URL is the current origin.
  const path = kind === 'COURSE_ROADMAP' ? 'roadmap' : 'readme';
  return `${window.location.origin}/share/${path}/${token}`;
}

export default function ShareButton({ kind, refId, label, description }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <ShareDialog
          kind={kind}
          refId={refId}
          title={label}
          description={description}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ShareDialog({
  kind,
  refId,
  title,
  description,
  onClose,
}: {
  kind: ShareKind;
  refId: string;
  title: string;
  description?: string;
  onClose: () => void;
}) {
  const { data: shares, isLoading } = useSharesForRef(kind, refId);
  const create = useCreateShare();
  const revoke = useRevokeShare();

  async function onCreate() {
    try {
      await create.mutateAsync({ kind, refId });
      // The create mutation invalidates the shares query, so the new link will
      // appear in the list momentarily. The toast confirms success.
      showToast('Link created');
    } catch (e) {
      toastError(e);
    }
  }

  async function onRevoke(id: string) {
    try {
      await revoke.mutateAsync(id);
      showToast('Link revoked');
    } catch (e) {
      toastError(e);
    }
  }

  // The newest share gets a brief highlight so the user can spot the one they
  // just made. After ~3s the highlight fades.
  const newestId = shares && shares.length > 0 ? shares[0].id : null;

  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button subtle" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="button primary"
            onClick={onCreate}
            disabled={create.isPending}
          >
            {create.isPending ? 'Creating…' : 'Create new link'}
          </button>
        </>
      }
    >
      {description && <p className="share-description">{description}</p>}

      <div className="share-list">
        {isLoading && <div className="share-empty">Loading…</div>}
        {!isLoading && (shares?.length ?? 0) === 0 && (
          <div className="share-empty">No active links yet. Click "Create new link" to make one.</div>
        )}
        {shares?.map((s) => (
          <ShareRow
            key={s.id}
            share={s}
            highlight={s.id === newestId && create.isSuccess}
            onRevoke={() => onRevoke(s.id)}
            revoking={revoke.isPending}
          />
        ))}
      </div>
    </Modal>
  );
}

function ShareRow({
  share,
  highlight,
  onRevoke,
  revoking,
}: {
  share: Share;
  highlight?: boolean;
  onRevoke: () => void;
  revoking: boolean;
}) {
  const url = buildShareUrl(share.token, share.kind);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Link copied to clipboard');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Could not copy to clipboard');
    }
  }

  return (
    <div className={`share-row ${highlight ? 'share-row-highlight' : ''}`}>
      <div className="share-row-meta">
        <span className="share-row-date">
          Created {new Date(share.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="share-row-url-row">
        <input
          type="text"
          readOnly
          value={url}
          className="share-row-url"
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
          aria-label="Share URL"
        />
        <button type="button" className="button" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="share-row-actions">
        <button
          type="button"
          className="button danger"
          onClick={onRevoke}
          disabled={revoking}
        >
          {revoking ? 'Revoking…' : 'Revoke'}
        </button>
      </div>
    </div>
  );
}
