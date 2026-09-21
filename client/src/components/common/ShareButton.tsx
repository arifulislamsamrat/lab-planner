import { useEffect, useRef, useState } from 'react';
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
  /** When true, render a compact icon-only trigger (used inside tight UI like kanban cards). */
  iconOnly?: boolean;
  /**
   * When true, the popup is a minimal "Create link & copy" dialog — no list,
   * no revoke. Use for contextual share actions like the kanban card where a
   * full manage-links view is overkill. Defaults to false (full manage dialog).
   */
  minimal?: boolean;
}

function buildShareUrl(token: string, kind: ShareKind): string {
  // Public pages live at /share/<readme|roadmap>/:token. The token kind determines
  // which page we deep-link to. base URL is the current origin.
  const path = kind === 'COURSE_ROADMAP' ? 'roadmap' : 'readme';
  return `${window.location.origin}/share/${path}/${token}`;
}

export default function ShareButton({ kind, refId, label, description, iconOnly, minimal }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          className="button ghost icon share-button-icon"
          onClick={() => setOpen(true)}
          aria-label={label}
          title={label}
        >
          <span aria-hidden="true">🔗</span>
        </button>
      ) : (
        <button type="button" className="button" onClick={() => setOpen(true)}>
          {label}
        </button>
      )}
      {open && (
        minimal ? (
          <MinimalShareDialog
            kind={kind}
            refId={refId}
            title={label}
            description={description}
            onClose={() => setOpen(false)}
          />
        ) : (
          <ManageShareDialog
            kind={kind}
            refId={refId}
            title={label}
            description={description}
            onClose={() => setOpen(false)}
          />
        )
      )}
    </>
  );
}

/**
 * Minimal share popup: just a "Create link" button. After creation, shows the
 * URL with a Copy button. No list, no revoke, no manage UI — perfect for the
 * kanban card use case where the user just wants to share a single link quickly.
 * This eliminates the loading-then-empty-then-populated flicker that came from
 * the full list view in the small kanban modal context.
 */
function MinimalShareDialog({
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
  const create = useCreateShare();
  const [created, setCreated] = useState<{ id: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state every time the dialog mounts so reopening always starts fresh.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setCreated(null);
      setCopied(false);
    };
  }, []);

  async function onCreate() {
    try {
      const res = await create.mutateAsync({ kind, refId });
      const wrapped = res as { id?: string; token?: string; share?: { id?: string; token?: string } };
      const token = wrapped?.token ?? wrapped?.share?.token;
      const id = wrapped?.id ?? wrapped?.share?.id ?? token;
      if (token) setCreated({ id: id!, token });
      showToast('Share link created');
    } catch (e) {
      toastError(e);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Link copied to clipboard');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Could not copy to clipboard');
    }
  }

  const url = created ? buildShareUrl(created.token, kind) : null;

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
          {!created && (
            <button
              type="button"
              className="button primary"
              onClick={onCreate}
              disabled={create.isPending}
            >
              {create.isPending ? 'Creating…' : 'Create share link'}
            </button>
          )}
        </>
      }
    >
      {description && <p className="share-description">{description}</p>}

      {!created ? (
        <div className="share-minimal-cta">
          <p className="muted" style={{ margin: 0 }}>
            Anyone with the link will be able to view this in their browser. No login required.
          </p>
        </div>
      ) : (
        <div className="share-minimal-result">
          <label className="share-minimal-label">Your shareable link</label>
          <div className="share-row-url-row">
            <input
              type="text"
              readOnly
              value={url!}
              className="share-row-url"
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              aria-label="Share URL"
            />
            <button type="button" className="button primary" onClick={() => copy(url!)}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Full manage-share dialog: shows existing links with revoke actions and a
 * "Create new link" button. Used on the Course details / Lab details pages.
 */
function ManageShareDialog({
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

  // Track the ID of the most recently created share so we can highlight *only*
  // that one, and only briefly after creation. We remember the ID across the
  // refetch that follows a successful create so the highlight is stable (it
  // does NOT snap off when the query refetches).
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [highlightNonce, setHighlightNonce] = useState(0);

  async function onCreate() {
    try {
      const created = await create.mutateAsync({ kind, refId });
      if (created?.id) setLastCreatedId(created.id);
      setHighlightNonce((n) => n + 1);
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
            key={s.id === lastCreatedId ? `${s.id}-${highlightNonce}` : s.id}
            share={s}
            highlight={s.id === lastCreatedId}
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
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (highlight) hasPlayedRef.current = true;
  }, [highlight]);

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
    <div
      className={`share-row ${highlight && !hasPlayedRef.current ? 'share-row-highlight' : ''} ${
        highlight ? 'share-row-highlighted' : ''
      }`}
    >
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