import { useEffect, useMemo, useRef, useState } from 'react';
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
import StatusBadge from '../common/StatusBadge';
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
  // We only call status updates on the first courseId for simplicity; the
  // endpoint does not depend on courseId on the client side anyway.
  const primaryCourseId = courseIds[0] ?? '';
  const updateStatus = useUpdateLabStatus(primaryCourseId);
  const reorderAcross = useReorderLabsAcross(primaryCourseId);

  const [byStatus, setByStatus] = useState<Record<LabStatus, KanbanLabEntry[]>>(() => bucket(labs));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sync local state from upstream labs (server refetch / filter changes).
  useEffect(() => {
    setByStatus(bucket(labs));
    // We intentionally only re-sync on labs change, not on bucket fn identity.
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
    <div>
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
          <span>{LAB_STATUS_LABELS[status]}</span>
          <span className="count">{entries.length}</span>
        </div>
        <div className="kanban-col-body" data-status={status}>
          {entries.length === 0 && (
            <div className="muted" style={{ textAlign: 'center', fontSize: 12, padding: 8 }}>Drop labs here</div>
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${dragging ? 'dragging' : ''} ${isOver ? 'over' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="title">
        <Link to={`/labs/${entry.lab._id}`} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          {entry.lab.title}
        </Link>
      </div>
      <div className="meta">
        <span>
          {entry.lab.estimatedTime ? `${entry.lab.estimatedTime} min` : ''}
          {showCourse && entry.courseTitle ? ` · ${entry.courseTitle}` : ''}
        </span>
        <StatusBadge status={entry.lab.status} />
      </div>
      <div className="kanban-card-footer" onPointerDown={(e) => e.stopPropagation()}>
        <AssigneeChip lab={entry.lab} canAssign={canAssign} />
      </div>
    </div>
  );
}

function AssigneeChip({ lab, canAssign }: { lab: Lab; canAssign: boolean }) {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userApi.list });
  const assign = useAssignLab();
  const unassign = useUnassignLab();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onDoc);
        document.removeEventListener('keydown', onKey);
      };
    }
  }, [open]);

  const assignedUser: User | undefined = (users ?? []).find((u) => u.id === lab.assignedMinionId);
  const minions: User[] = (users ?? []).filter((u) => u.role === 'MINION' && u.isActive);

  if (!canAssign) {
    return (
      <span className={`kanban-assignee ${assignedUser ? '' : 'kanban-assignee--empty'}`}>
        <span aria-hidden="true">👤</span>
        <span>{assignedUser ? assignedUser.name : 'Unassigned'}</span>
      </span>
    );
  }

  return (
    <div className="kanban-assignee-wrap" ref={ref}>
      <button
        type="button"
        className={`kanban-assignee ${assignedUser ? '' : 'kanban-assignee--empty'}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={assignedUser ? `Assigned to ${assignedUser.name}. Click to change.` : 'Click to assign a minion'}
        disabled={assign.isPending || unassign.isPending}
      >
        <span aria-hidden="true">👤</span>
        <span>{assignedUser ? assignedUser.name : 'Assign…'}</span>
      </button>
      {open && (
        <div className="kanban-assignee-pop" role="menu">
          {minions.length === 0 && (
            <div className="muted" style={{ padding: 8, fontSize: 12 }}>No active minions yet — add one in Users.</div>
          )}
          {minions.map((u) => (
            <button
              key={u.id}
              type="button"
              role="menuitem"
              className={`user-menu-item ${lab.assignedMinionId === u.id ? 'active' : ''}`}
              onClick={() => {
                assign.mutate({ labId: lab._id, minionId: u.id }, { onSuccess: () => setOpen(false) });
              }}
            >
              <span>{u.name}</span>
              <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>{u.email}</span>
            </button>
          ))}
          {assignedUser && (
            <>
              <div className="action-menu-divider" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="user-menu-item danger"
                onClick={() => unassign.mutate(lab._id, { onSuccess: () => setOpen(false) })}
              >
                Unassign
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
