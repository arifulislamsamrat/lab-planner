import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  /** Render the modal as a fullscreen overlay (no max-width, no rounded corners). */
  fullscreen?: boolean;
}

export default function Modal({ open, title, onClose, children, footer, wide, fullscreen }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const className = ['modal', wide ? 'modal-wide' : '', fullscreen ? 'modal-fullscreen' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={className} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}
