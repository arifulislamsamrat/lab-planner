import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface ActionMenuHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

interface Props {
  items: MenuItem[];
  trigger?: React.ReactNode;
  label?: string;
  /** Alignment of the dropdown relative to the trigger. */
  align?: 'right' | 'left';
}

const MENU_MIN_WIDTH = 240;
const VIEWPORT_MARGIN = 8;

interface Position {
  top: number;
  left: number;
  width: number;
  upward: boolean;
}

function computePosition(
  triggerEl: HTMLElement | null,
  align: 'right' | 'left',
): Position {
  if (!triggerEl) return { top: 0, left: 0, width: MENU_MIN_WIDTH, upward: false };
  const rect = triggerEl.getBoundingClientRect();

  // Estimate menu height from the items prop directly (no DOM measurement needed).
  // items.length + dividers.length is known from props.
  // (We don't have dividers count here; fall back to MENU_MIN_WIDTH single-block estimate.)
  const estHeight = Math.max(
    120,
    window.innerHeight / 4, // safe upper bound: 25% of viewport
  );

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const upward = spaceBelow < estHeight && spaceAbove > spaceBelow;

  const width = MENU_MIN_WIDTH;

  let top = upward ? rect.top - estHeight - VIEWPORT_MARGIN : rect.bottom + VIEWPORT_MARGIN;
  let left: number;
  if (align === 'right') {
    left = rect.right - width;
  } else {
    left = rect.left;
  }

  // Clamp to viewport so the menu never overflows off-screen.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left + width > vw - VIEWPORT_MARGIN) left = vw - width - VIEWPORT_MARGIN;
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
  if (top + estHeight > vh - VIEWPORT_MARGIN) top = vh - estHeight - VIEWPORT_MARGIN;
  if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

  return { top, left, width, upward };
}

const ActionMenu = forwardRef<ActionMenuHandle, Props>(function ActionMenu(
  { items, trigger, label = 'Actions', align = 'right' },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((o) => !o),
  }), []);

  const setTrigger = (el: HTMLElement | null) => { triggerRef.current = el; };

  // Measure sync before paint using the trigger's rect.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const p = computePosition(triggerRef.current, align);
    setPos(p);
  }, [open, align, items.length]);

  // Close on outside click / Escape / scroll / resize.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onScrollResize() { setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onScrollResize);
    window.addEventListener('scroll', onScrollResize, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onScrollResize);
      window.removeEventListener('scroll', onScrollResize, true);
    };
  }, [open]);

    const triggerProps = {
    onClick: () => setOpen((o) => !o),
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    'aria-label': label,
    title: label,
    className: 'button ghost icon action-menu-trigger',
  };

  const triggerNode = trigger ? (
    <span {...triggerProps} ref={setTrigger} className="action-menu-trigger-wrap">{trigger}</span>
  ) : (
    <button {...triggerProps} ref={setTrigger} type="button">
      <span aria-hidden="true">⋯</span>
    </button>
  );

  // Inline styles win against any compiled CSS rule, with !important-equivalent
  // specificity from being on the element with style attr. Position fixed at
  // document.body means no ancestor can clip or transform us.
  const dropdownStyle: React.CSSProperties | undefined = pos
    ? {
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        minWidth: pos.width,
        zIndex: 99999,
        // Reset any inherited transform/filter from CSS animations.
        animation: 'none',
        transform: 'none',
        opacity: 1,
      }
    : undefined;

  const dropdown = open && pos ? createPortal(
    <div
      ref={menuRef}
      className="action-menu-dropdown"
      role="menu"
      style={dropdownStyle}
    >
      {items.map((it, idx) => (
        it.divider ? (
          <div key={`div-${idx}`} className="action-menu-divider" role="separator" />
        ) : (
          <button
            key={`${idx}-${it.label}`}
            role="menuitem"
            className={`user-menu-item ${it.danger ? 'danger' : ''}`}
            disabled={it.disabled}
            onClick={() => { setOpen(false); it.onClick(); }}
          >
            {it.icon && <span className="nav-icon" aria-hidden="true">{it.icon}</span>}
            <span>{it.label}</span>
          </button>
        )
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      {triggerNode}
      {dropdown}
    </>
  );
});

export default ActionMenu;
