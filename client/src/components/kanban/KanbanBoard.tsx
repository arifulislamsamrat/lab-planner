import { useMemo, useState } from 'react';
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
import { LAB_STATUSES, LAB_STATUS_LABELS } from '../../utils/constants';
import { useUpdateLabStatus, useReorderLabsAcross } from '../../hooks/usePlanningMutations';
import type { CoursePlanningTree, Lab, LabStatus } from '../../types/domain';

interface Props {
  courseId: string;
  planning: CoursePlanningTree;
}

interface FlatLab {
  lab: Lab;
  courseId: string;
}

function flattenLabs(planning: CoursePlanningTree, filters: Filters): FlatLab[] {
  const out: FlatLab[] = [];
  for (const m of planning.milestones) {
    if (filters.milestoneId && m._id !== filters.milestoneId) continue;
    for (const mod of m.modules) {
      if (filters.moduleId && mod._id !== filters.moduleId) continue;
      for (const g of mod.labGroups) {
        if (filters.labGroupId && g._id !== filters.labGroupId) continue;
        for (const lab of g.labs) out.push({ lab, courseId: planning.course._id });
      }
    }
  }
  return out;
}

interface Filters {
  milestoneId?: string;
  moduleId?: string;
  labGroupId?: string;
}

export default function KanbanBoard({ courseId, planning }: Props) {
  const [filters, setFilters] = useState<Filters>({});
  const labs = useMemo(() => flattenLabs(planning, filters), [planning, filters]);
  const updateStatus = useUpdateLabStatus(courseId);
  const reorderAcross = useReorderLabsAcross(courseId);

  // Local optimistic map of labs by status so the UI feels instant.
  const [byStatus, setByStatus] = useState<Record<LabStatus, Lab[]>>(() => bucket(labs.map((x) => x.lab)));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sync from server-provided data when filters or upstream labs change.
  useMemo(() => {
    setByStatus(bucket(labs.map((x) => x.lab)));
  }, [labs]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function findStatusForId(id: string): LabStatus | null {
    for (const s of LAB_STATUSES) if (byStatus[s].some((l) => l._id === id)) return s;
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
      const moving = prev[activeStatus].find((l) => l._id === activeId);
      if (!moving) return prev;
      next[activeStatus] = prev[activeStatus].filter((l) => l._id !== activeId);
      next[overStatus] = [{ ...moving, status: overStatus }, ...prev[overStatus]];
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
      // Dropped on a column — status changed, ensure server sync.
      const newStatus = overId as LabStatus;
      const lab = byStatus[newStatus].find((l) => l._id === activeId);
      if (lab && lab.status !== newStatus) {
        updateStatus.mutate({ id: activeId, status: newStatus });
      }
      return;
    }

    const overStatus = findStatusForId(overId);
    if (!overStatus) return;
    const list = byStatus[overStatus];
    const oldIndex = list.findIndex((l) => l._id === activeId);
    const newIndex = list.findIndex((l) => l._id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(list, oldIndex, newIndex);
    setByStatus((prev) => ({ ...prev, [overStatus]: next }));

    reorderAcross.mutate(
      next.map((l, i) => ({ id: l._id, order: i })).concat(
        // Also include orders in other columns to avoid stale ordering on backend
        LAB_STATUSES.filter((s) => s !== overStatus).flatMap((s) => byStatus[s].map((l, i) => ({ id: l._id, order: i }))),
      ),
    );
  }

  return (
    <div>
      <div className="row mb-4" style={{ flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 220 }} value={filters.milestoneId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, milestoneId: e.target.value || undefined, moduleId: undefined, labGroupId: undefined }))}>
          <option value="">Milestone: All</option>
          {planning.milestones.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
        </select>
        <select className="select" style={{ width: 220 }} value={filters.moduleId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, moduleId: e.target.value || undefined, labGroupId: undefined }))} disabled={!filters.milestoneId}>
          <option value="">Module: All</option>
          {planning.milestones.flatMap((m) => m.modules).filter((mod) => !filters.milestoneId || mod.milestoneId === filters.milestoneId).map((mod) => (
            <option key={mod._id} value={mod._id}>{mod.title}</option>
          ))}
        </select>
        <select className="select" style={{ width: 220 }} value={filters.labGroupId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, labGroupId: e.target.value || undefined }))} disabled={!filters.moduleId}>
          <option value="">Lab Group: All</option>
          {planning.milestones.flatMap((m) => m.modules).filter((mod) => !filters.moduleId || mod._id === filters.moduleId).flatMap((mod) => mod.labGroups).map((g) => (
            <option key={g._id} value={g._id}>{g.title}</option>
          ))}
        </select>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="kanban">
          {LAB_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              labs={byStatus[status]}
              draggingId={draggingId}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function bucket(labs: Lab[]): Record<LabStatus, Lab[]> {
  const out: Record<LabStatus, Lab[]> = { BACKLOG: [], PLANNED: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
  for (const l of labs) (out[l.status] ||= []).push(l);
  return out;
}

function KanbanColumn({ status, labs, draggingId }: { status: LabStatus; labs: Lab[]; draggingId: string | null }) {
  return (
    <SortableContext id={status} items={labs.map((l) => l._id)} strategy={verticalListSortingStrategy}>
      <div className={`kanban-col kanban-col-${status}`}>
        <div className="kanban-col-header">
          <span>{LAB_STATUS_LABELS[status]}</span>
          <span className="count">{labs.length}</span>
        </div>
        <div className="kanban-col-body" data-status={status}>
          {labs.length === 0 && (
            <div className="muted" style={{ textAlign: 'center', fontSize: 12, padding: 8 }}>Drop labs here</div>
          )}
          {labs.map((l) => (
            <KanbanCard key={l._id} lab={l} dragging={draggingId === l._id} />
          ))}
        </div>
      </div>
    </SortableContext>
  );
}

function KanbanCard({ lab, dragging }: { lab: Lab; dragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id: lab._id, data: { lab } });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: dragging ? 0.6 : 1,
    outline: isOver ? '2px solid var(--color-primary)' : undefined,
    outlineOffset: -2,
  };
  return (
    <div ref={setNodeRef} style={style} className={`kanban-card ${dragging ? 'dragging' : ''} ${isOver ? 'over' : ''}`} {...attributes} {...listeners}>
      <div className="title">
        <Link to={`/labs/${lab._id}`}>{lab.title}</Link>
      </div>
      <div className="meta">
        <span>{lab.estimatedTime ? `${lab.estimatedTime} min` : ''}</span>
        <StatusBadge status={lab.status} />
      </div>
    </div>
  );
}