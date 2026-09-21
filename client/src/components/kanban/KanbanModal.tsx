import { useEffect, useMemo, useState } from 'react';
import { createContext, useContext } from 'react';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';
import KanbanBoard, { type KanbanLabEntry } from './KanbanBoard';
import StatusFilterChips from './StatusFilterChips';
import { Skeleton, SkeletonPageHeader } from './../common/Skeleton';
import { useCourses } from '../../hooks/useCourses';
import { useCoursePlanning } from '../../hooks/useCoursePlanning';
import { LAB_STATUSES } from '../../utils/constants';
import type { CoursePlanningTree, LabStatus } from '../../types/domain';

const ALL = '__ALL__';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Slots {
  [courseId: string]: { data: CoursePlanningTree | undefined; dataUpdatedAt: number; isLoading: boolean };
}

const SlotsContext = createContext<{ slots: Slots; setSlot: (id: string, s: Slots[string]) => void } | null>(null);

/**
 * Full-screen Kanban popup. Hosts the same board logic as the inline page,
 * with header bar (course picker + status chips) and a sticky close button.
 */
export default function KanbanModal({ open, onClose }: Props) {
  return (
    <Modal open={open} title="Kanban Board" onClose={onClose} fullscreen>
      <KanbanModalBody onClose={onClose} />
    </Modal>
  );
}

function KanbanModalBody({ onClose: _onClose }: { onClose: () => void }) {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const [coursePick, setCoursePick] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<LabStatus | null>(null);

  const validCourses = courses ?? [];
  const coursePickResolved =
    coursePick === ALL || validCourses.some((c) => c._id === coursePick) ? coursePick : ALL;

  const selectedSingleCourse =
    coursePickResolved !== ALL ? validCourses.find((c) => c._id === coursePickResolved) : undefined;

  return (
    <div className="kanban-modal-body">
      <div className="kanban-modal-toolbar">
        <div className="muted" style={{ fontSize: 13 }}>
          {coursePickResolved === ALL
            ? `${validCourses.length} course${validCourses.length === 1 ? '' : 's'}`
            : selectedSingleCourse?.title}
        </div>
        <select
          className="select"
          style={{ width: 240 }}
          value={coursePickResolved}
          onChange={(e) => setCoursePick(e.target.value)}
          aria-label="Course scope"
        >
          <option value={ALL}>All courses</option>
          {validCourses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>

      {coursesLoading || validCourses.length === 0 ? (
        <ModalSkeleton />
      ) : coursePickResolved !== ALL && selectedSingleCourse ? (
        <SingleCourseBody
          courseId={selectedSingleCourse._id}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      ) : (
        <MultiCourseBody
          courseIds={validCourses.map((c) => c._id)}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}
    </div>
  );
}

function SingleCourseBody({
  courseId,
  statusFilter,
  setStatusFilter,
}: {
  courseId: string;
  statusFilter: LabStatus | null;
  setStatusFilter: (v: LabStatus | null) => void;
}) {
  const { data: planning, isLoading } = useCoursePlanning(courseId);
  const entries = useMemo<KanbanLabEntry[]>(() => {
    if (!planning) return [];
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
  }, [planning]);

  const counts = useMemo(() => {
    const out: Partial<Record<LabStatus, number>> = {};
    for (const e of entries) out[e.lab.status] = (out[e.lab.status] ?? 0) + 1;
    return out;
  }, [entries]);

  return (
    <>
      <StatusFilterChips
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
        totalCount={entries.length}
      />
      {isLoading ? (
        <ModalSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No labs yet"
          description="Add milestones → modules → lab groups → labs in Lab Planning to start tracking."
        />
      ) : (
        <KanbanBoard mode="single" courseId={courseId} planning={planning!} statusFilter={statusFilter} />
      )}
    </>
  );
}

function MultiCourseBody({
  courseIds,
  statusFilter,
  setStatusFilter,
}: {
  courseIds: string[];
  statusFilter: LabStatus | null;
  setStatusFilter: (v: LabStatus | null) => void;
}) {
  const [slots, setSlots] = useState<Slots>({});
  const setSlot = (id: string, slot: Slots[string]) =>
    setSlots((prev) => (prev[id] === slot ? prev : { ...prev, [id]: slot }));

  return (
    <SlotsContext.Provider value={{ slots, setSlot }}>
      {courseIds.map((id) => (
        <CourseFetcher key={id} courseId={id} />
      ))}
      <Aggregator statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
    </SlotsContext.Provider>
  );
}

function CourseFetcher({ courseId }: { courseId: string }) {
  const { data, isLoading, dataUpdatedAt } = useCoursePlanning(courseId);
  const ctx = useContext(SlotsContext);
  useEffect(() => {
    ctx?.setSlot(courseId, { data, dataUpdatedAt, isLoading });
  }, [ctx, courseId, data, isLoading, dataUpdatedAt]);
  return null;
}

function Aggregator({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: LabStatus | null;
  setStatusFilter: (v: LabStatus | null) => void;
}) {
  const ctx = useContext(SlotsContext);
  const slots: Slots = ctx?.slots ?? {};

  const entries = useMemo<KanbanLabEntry[]>(() => {
    const out: KanbanLabEntry[] = [];
    for (const id in slots) {
      const planning = slots[id]?.data;
      if (!planning) continue;
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
    }
    return out;
  }, [slots]);

  const counts = useMemo(() => {
    const out: Partial<Record<LabStatus, number>> = {};
    for (const e of entries) out[e.lab.status] = (out[e.lab.status] ?? 0) + 1;
    return out;
  }, [entries]);

  const isAnyLoading = Object.values(slots).some((s) => s.isLoading);
  const hasAnyData = Object.values(slots).some((s) => s.data);

  return (
    <>
      <StatusFilterChips
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
        totalCount={entries.length}
      />
      {!hasAnyData && isAnyLoading ? (
        <ModalSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No labs yet"
          description="Once you add milestones → modules → lab groups → labs, they will appear here."
        />
      ) : (
        <KanbanBoard mode="multi" entries={entries} statusFilter={statusFilter} />
      )}
    </>
  );
}

function ModalSkeleton() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="row mb-4" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={32} width={100} radius="var(--radius-pill)" />
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          minHeight: 400,
        }}
      >
        {LAB_STATUSES.map((s) => (
          <div key={s} className="card skeleton-card" style={{ minHeight: 320 }}>
            <Skeleton height={16} width="40%" />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={120} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
