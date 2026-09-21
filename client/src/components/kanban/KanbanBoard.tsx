import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import ActionMenu from '../common/ActionMenu';
import ShareButton from '../common/ShareButton';
import { LAB_STATUSES, LAB_STATUS_LABELS, ASSIGNMENT_ROLES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useAssignLab, useUnassignLab } from '../../hooks/useLab';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../services/userApi';
import { useUpdateLabStatus, useReorderLabsAcross } from '../../hooks/usePlanningMutations';
import type { CoursePlanningTree, Lab, LabStatus, User } from '../../types/domain';

/**
 * Lab card metadata used by the board. In single-course mode the location
 * fields are populated from the planning tree; in multi-course mode they come
 * straight from the parent wrapper (KanbanPage).
 */
export interface KanbanLabEntry {
  lab: Lab;
  courseId: string;
  courseTitle: string;
  milestoneTitle: string;
  moduleTitle: string;
  labGroupTitle: string;
}

interface SingleCourseProps {
  mode?: 'single';
  courseId: string;
  planning: CoursePlanningTree;
  statusFilter?: LabStatus | null;
}

interface MultiCourseProps {
  mode: 'multi';
  entries: KanbanLabEntry[];
  statusFilter?: LabStatus | null;
}

type Props = SingleCourseProps | MultiCourseProps;

interface Filters {
  milestoneId?: string;
  moduleId?: string;
  labGroupId?: string;
}

function flattenPlanning(planning: CoursePlanningTree): KanbanLabEntry[] {
  const out: KanbanLabEntry[] = [];
  for (const m of planning.milestones) {
    for (const mod of m.modules) {
      for (const g of mod.labGroups) {
        for (const lab of g.labs) {
          out.push({
            lab,
            courseId: planning.course._id,
            courseTitle: planning.course.title,
            milestoneTitle: m.title,
            moduleTitle: mod.title,
            labGroupTitle: g.title,
          });
        }
      }
    }
  }
  return out;
}

export default function KanbanBoard(props: Props) {
  const entriesAll = useMemo<KanbanLabEntry[]>(() => {
    if (props.mode === 'multi') return props.entries;
    return flattenPlanning(props.planning);
  }, [props]);

  const [filters, setFilters] = useState<Filters>({});
  const [statusFilter, setStatusFilter] = useState<LabStatus | null>(props.statusFilter ?? null);

  // Keep statusFilter in sync if parent prop changes.
  useEffect(() => {
    setStatusFilter(props.statusFilter ?? null);
  }, [props.statusFilter]);

  const labs = useMemo(() => {
    const filtered = entriesAll.filter((e) => {
      if (filters.milestoneId && e.milestoneTitle !== filters.milestoneId) return false;
      if (filters.moduleId && e.moduleTitle !== filters.moduleId) return false;
      if (filters.labGroupId && e.labGroupTitle !== filters.labGroupId) return false;
      if (statusFilter && e.lab.status !== statusFilter) return false;
      return true;
    });
    return filtered;
  }, [entriesAll, filters, statusFilter]);

  const courseIds = useMemo(() => Array.from(new Set(entriesAll.map((e) => e.courseId))), [entriesAll]);
  const primaryCourseId = courseIds[0] ?? '';
  const updateStatus = useUpdateLabStatus(primaryCourseId);
  const reorderAcross = useReorderLabsAcross(primaryCourseId);

  const [byStatus, setByStatus] = useState<Record<LabStatus, KanbanLabEntry[]>>(() => bucket(labs));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setByStatus(bucket(labs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labs]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function findStatusForId(id: string): LabStatus | null {
    for (const s of LAB_STATUSES) if (byStatus[s].some((e) => e.lab._id === id)) return s;
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeStatus = findStatusForId(activeId);
    const overStatus = LAB_STATUSES.includes(overId as LabStatus)
      ? (overId as LabStatus)
      : findStatusForId(overId);
    if (!activeStatus || !overStatus) return;
    if (activeStatus === overStatus) return;

    setByStatus((prev) => {
      const next = { ...prev };
      const moving = prev[activeStatus].find((e) => e.lab._id === activeId);
      if (!moving) return prev;
      next[activeStatus] = prev[activeStatus].filter((e) => e.lab._id !== activeId);
      next[overStatus] = [{ ...moving, lab: { ...moving.lab, status: overStatus } }, ...prev[overStatus]];
      return next;
    });
  }

  function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const activeStatus = findStatusForId(activeId);
    if (!activeStatus) return;

    if (LAB_STATUSES.includes(overId as LabStatus)) {
      const newStatus = overId as LabStatus;
      const entry = byStatus[newStatus].find((e) => e.lab._id === activeId);
      if (entry && entry.lab.status !== newStatus) {
        updateStatus.mutate({ id: activeId, status: newStatus });
      }
      return;
    }

    const overStatus = findStatusForId(overId);
    if (!overStatus) return;
    const list = byStatus[overStatus];
    const oldIndex = list.findIndex((e) => e.lab._id === activeId);
    const newIndex = list.findIndex((e) => e.lab._id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(list, oldIndex, newIndex);
    setByStatus((prev) => ({ ...prev, [overStatus]: next }));

    reorderAcross.mutate(
      next.map((e, i) => ({ id: e.lab._id, order: i })).concat(
        LAB_STATUSES.filter((s) => s !== overStatus).flatMap((s) => byStatus[s].map((e, i) => ({ id: e.lab._id, order: i }))),
      ),
    );
  }

  const showMultiCourse = props.mode === 'multi';
  const milestoneOptions = useMemo(() => Array.from(new Set(entriesAll.map((e) => e.milestoneTitle))).sort(), [entriesAll]);
  const moduleOptions = useMemo(() => {
    const base = filters.milestoneId ? entriesAll.filter((e) => e.milestoneTitle === filters.milestoneId) : entriesAll;
    return Array.from(new Set(base.map((e) => e.moduleTitle))).sort();
  }, [entriesAll, filters.milestoneId]);
  const labGroupOptions = useMemo(() => {
    const base = filters.moduleId ? entriesAll.filter((e) => e.moduleTitle === filters.moduleId) : entriesAll;
    return Array.from(new Set(base.map((e) => e.labGroupTitle))).sort();
  }, [entriesAll, filters.moduleId]);

  return (
    <div className="kanban-shell">
      <div className="row mb-4" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <select
          className="select"
          style={{ width: 200 }}
          value={filters.milestoneId ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, milestoneId: e.target.value || undefined, moduleId: undefined, labGroupId: undefined }))
          }
        >
          <option value="">Milestone: All</option>
          {milestoneOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: 200 }}
          value={filters.moduleId ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, moduleId: e.target.value || undefined, labGroupId: undefined }))
          }
          disabled={!filters.milestoneId}
        >
          <option value="">Module: All</option>
          {moduleOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: 200 }}
          value={filters.labGroupId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, labGroupId: e.target.value || undefined }))}
          disabled={!filters.moduleId}
        >
          <option value="">Lab Group: All</option>
          {labGroupOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="kanban">
          {LAB_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              entries={byStatus[status]}
              draggingId={draggingId}
              showCourse={showMultiCourse}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function bucket(entries: KanbanLabEntry[]): Record<LabStatus, KanbanLabEntry[]> {
  const out: Record<LabStatus, KanbanLabEntry[]> = { BACKLOG: [], PLANNED: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
  for (const e of entries) (out[e.lab.status] ||= []).push(e);
  return out;
}

function KanbanColumn({
  status,
  entries,
  draggingId,
  showCourse,
}: {
  status: LabStatus;
  entries: KanbanLabEntry[];
  draggingId: string | null;
  showCourse: boolean;
}) {
  return (
    <SortableContext id={status} items={entries.map((e) => e.lab._id)} strategy={verticalListSortingStrategy}>
      <div className={`kanban-col kanban-col-${status}`}>
        <div className="kanban-col-header">
          <span className="kanban-col-title">{LAB_STATUS_LABELS[status]}</span>
          <span className="count">{entries.length}</span>
        </div>
        <div className="kanban-col-body" data-status={status}>
          {entries.length === 0 && (
            <div className="muted" style={{ textAlign: 'center', fontSize: 12, padding: 12 }}>Drop labs here</div>
          )}
          {entries.map((entry) => (
            <KanbanCard
              key={entry.lab._id}
              entry={entry}
              dragging={draggingId === entry.lab._id}
              showCourse={showCourse}
            />
          ))}
        </div>
      </div>
    </SortableContext>
  );
}

function KanbanCard({
  entry,
  dragging,
  showCourse,
}: {
  entry: KanbanLabEntry;
  dragging: boolean;
  showCourse: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id: entry.lab._id, data: { entry } });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: dragging ? 0.6 : 1,
    outline: isOver ? '2px solid var(--color-primary)' : undefined,
    outlineOffset: -2,
  };
  const { user } = useAuth();
  const canAssign = !!user && ASSIGNMENT_ROLES.includes(user.role as never);
  const canShare = !!user && ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'].includes(user.role);

  // Allow the card's ⋮ menu to programmatically reopen the assignee popover
  // (used by the "Reassign" menu item).
  const assigneeRef = useRef<AssigneeChipHandle>(null);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card kanban-card--${entry.lab.status} ${dragging ? 'dragging' : ''} ${isOver ? 'over' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Top row: status pill (left) + action menu (right).
          Pointer events on these elements skip drag start. */}
      <div className="kanban-card-top" onPointerDown={(e) => e.stopPropagation()}>
        <StatusPill lab={entry.lab} />
        <ActionMenu
          label="Card actions"
          align="right"
          items={[
            ...(canAssign
              ? ([
                  {
                    label: 'Reassign',
                    icon: '👤',
                    onClick: () => assigneeRef.current?.open(),
                  },
                ] as const)
              : []),
            { label: 'Open', icon: '↗', onClick: () => { window.location.href = `/labs/${entry.lab._id}`; } },
            { label: 'Set status', icon: '🔁', onClick: () => { /* set-status lives on the status pill itself */ } },
            ...(canShare
              ? ([
                  {
                    label: 'Share',
                    icon: '🔗',
                    onClick: () => { /* share button opens inline below */ },
                  },
                ] as const)
              : []),
          ]}
        />
      </div>

      {/* Title row: this is the drag handle for dnd-kit. */}
      <div className="kanban-card-title">
        <Link to={`/labs/${entry.lab._id}`} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          {entry.lab.title}
        </Link>
      </div>

      <div className="kanban-card-meta">
        <span className="kanban-card-meta-path">
          {showCourse && entry.courseTitle ? `${entry.courseTitle} · ` : ''}
          {entry.moduleTitle}
        </span>
        {entry.lab.estimatedTime ? <span className="kanban-card-meta-time">~{entry.lab.estimatedTime} min</span> : null}
      </div>

      <div className="kanban-card-footer" onPointerDown={(e) => e.stopPropagation()}>
        <AssigneeChip ref={assigneeRef} lab={entry.lab} canAssign={canAssign} />
        {canShare && (
          <ShareButton
            kind="LAB_README"
            refId={entry.lab._id}
            label="Share"
            description="Anyone with the link can view this lab's readme in their browser. No login required."
          />
        )}
      </div>
    </div>
  );
}

function StatusPill({ lab }: { lab: Lab }) {
  const updateStatus = useUpdateLabStatus('');
  const items = LAB_STATUSES.map((s) => ({
    label: LAB_STATUS_LABELS[s],
    icon: s === lab.status ? '✓' : undefined,
    onClick: () => {
      if (s !== lab.status) updateStatus.mutate({ id: lab._id, status: s });
    },
  }));
  return (
    <ActionMenu
      label={`Status: ${LAB_STATUS_LABELS[lab.status]}. Click to change.`}
      align="left"
      items={items}
      trigger={
        <span className={`kanban-status-pill kanban-status-pill--${lab.status}`}>
          <span className="dot" aria-hidden="true" />
          {LAB_STATUS_LABELS[lab.status]}
        </span>
      }
    />
  );
}

// === Assignee chip + popover ===

export interface AssigneeChipHandle {
  open: () => void;
  close: () => void;
}

interface AssigneePopoverPosition {
  top: number;
  left: number;
  width: number;
  upward: boolean;
}

function computePopoverPosition(triggerEl: HTMLElement | null): AssigneePopoverPosition | null {
  if (!triggerEl) return null;
  const rect = triggerEl.getBoundingClientRect();
  const width = 280;
  const margin = 8;
  const maxHeight = 280;

  // Prefer downward; if not enough space, flip upward.
  const spaceBelow = window.innerHeight - rect.bottom;
  const upward = spaceBelow < maxHeight + margin && rect.top > spaceBelow;
  const top = upward
    ? Math.max(margin, rect.top - 8 - maxHeight) // approximate; menu height capped by inner content + scroll
    : rect.bottom + margin;

  let left: number;
  // Align popover's left edge with trigger's left edge, but clamp inside viewport.
  left = rect.left;
  if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
  if (left < margin) left = margin;

  return { top, left, width, upward };
}

const AssigneeChip = forwardRef<AssigneeChipHandle, { lab: Lab; canAssign: boolean }>(function AssigneeChip(
  { lab, canAssign },
  ref,
) {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userApi.list });
  const assign = useAssignLab();
  const unassign = useUnassignLab();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<AssigneePopoverPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }));

  // Reposition when opening, on scroll, and on resize.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const recompute = () => setPos(computePopoverPosition(triggerRef.current));
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      const pop = document.getElementById(`assignee-pop-${lab._id}`);
      if (pop?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, lab._id]);

  const assignedUser: User | undefined = (users ?? []).find((u) => u.id === lab.assignedMinionId);
  const minions: User[] = (users ?? []).filter((u) => u.role === 'MINION' && u.isActive);

  if (!canAssign) {
    return (
      <span className={`kanban-assignee ${assignedUser ? '' : 'kanban-assignee--empty'}`}>
        <span className="kanban-assignee-avatar" aria-hidden="true">👤</span>
        <span className="kanban-assignee-name">{assignedUser ? assignedUser.name : 'Unassigned'}</span>
      </span>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`kanban-assignee ${assignedUser ? '' : 'kanban-assignee--empty'}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={assignedUser ? `Assigned to ${assignedUser.name}. Click to change.` : 'Click to assign a minion'}
        disabled={assign.isPending || unassign.isPending}
      >
        <span className="kanban-assignee-avatar" aria-hidden="true">👤</span>
        <span className="kanban-assignee-name">{assignedUser ? assignedUser.name : 'Assign…'}</span>
      </button>
      {open && pos && createPortal(
        <div
          id={`assignee-pop-${lab._id}`}
          className="kanban-assignee-pop"
          role="menu"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            maxHeight: 280,
            zIndex: 99999,
          }}
        >
          <div className="kanban-assignee-pop-head">
            <span>Assign minion</span>
          </div>
          {minions.length === 0 ? (
            <div className="muted" style={{ padding: 12, fontSize: 12 }}>
              No active minions yet — add one in Users first.
            </div>
          ) : (
            <div className="kanban-assignee-pop-list">
              {minions.map((u) => {
                const initials = (u.name || u.email).slice(0, 2).toUpperCase();
                const isAssigned = lab.assignedMinionId === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    role="menuitem"
                    className={`kanban-assignee-pop-row ${isAssigned ? 'is-assigned' : ''}`}
                    disabled={assign.isPending}
                    onClick={() => {
                      assign.mutate({ labId: lab._id, minionId: u.id }, { onSuccess: () => setOpen(false) });
                    }}
                  >
                    <span className="kanban-assignee-avatar" aria-hidden="true">{initials}</span>
                    <span className="kanban-assignee-pop-meta">
                      <span className="kanban-assignee-pop-name">{u.name}</span>
                      <span className="kanban-assignee-pop-email">{u.email}</span>
                    </span>
                    {isAssigned && <span className="kanban-assignee-pop-check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          {assignedUser && (
            <>
              <div className="action-menu-divider" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="kanban-assignee-pop-row danger"
                disabled={unassign.isPending}
                onClick={() => unassign.mutate(lab._id, { onSuccess: () => setOpen(false) })}
              >
                <span className="kanban-assignee-avatar danger" aria-hidden="true">⊘</span>
                <span className="kanban-assignee-pop-meta">
                  <span className="kanban-assignee-pop-name">Unassign</span>
                  <span className="kanban-assignee-pop-email">Remove current assignee</span>
                </span>
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
});
