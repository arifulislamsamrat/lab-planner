import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from '../hooks/useCourses';
import { useCoursePlanning } from '../hooks/useCoursePlanning';
import { Skeleton, SkeletonPageHeader } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import KanbanBoard, { type KanbanLabEntry } from '../components/kanban/KanbanBoard';
import StatusFilterChips from '../components/kanban/StatusFilterChips';
import { LAB_STATUSES } from '../utils/constants';
import type { CoursePlanningTree, LabStatus } from '../types/domain';

const ALL = '__ALL__';

/**
 * Workspace-level Kanban board. Visible to ADMIN, COURSE_COORDINATOR, INSTRUCTOR.
 * - "All courses" mode aggregates labs from every course into a single board.
 * - Single-course mode delegates to the same component for parity with the
 *   per-course Board tab on LabPlanningPage.
 */
export default function KanbanPage() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const [coursePick, setCoursePick] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<LabStatus | null>(null);

  const validCourses = courses ?? [];
  const coursePickResolved =
    coursePick === ALL || validCourses.some((c) => c._id === coursePick) ? coursePick : ALL;

  const selectedSingleCourse =
    coursePickResolved !== ALL ? validCourses.find((c) => c._id === coursePickResolved) : undefined;

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="page-subtitle">
            All labs across{' '}
            {coursePickResolved === ALL
              ? `${validCourses.length} course${validCourses.length === 1 ? '' : 's'}`
              : `“${selectedSingleCourse?.title}”`}
            . Drag cards to change status, or click a card's avatar to assign a minion.
          </p>
        </div>
        <div className="toolbar-right">
          <select
            className="select"
            style={{ width: 220 }}
            value={coursePickResolved}
            onChange={(e) => setCoursePick(e.target.value)}
            aria-label="Course scope"
          >
            <option value={ALL}>All courses</option>
            {validCourses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {coursesLoading ? (
        <SkeletonBoard />
      ) : validCourses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to start tracking labs on the board."
          action={
            <Link className="button primary" to="/courses">
              Go to Courses
            </Link>
          }
        />
      ) : coursePickResolved !== ALL && selectedSingleCourse ? (
        <SingleCourseBoard
          courseId={selectedSingleCourse._id}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      ) : (
        <MultiCourseBoard
          courseIds={validCourses.map((c) => c._id)}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}
    </>
  );
}

function SingleCourseBoard({
  courseId,
  statusFilter,
  setStatusFilter,
}: {
  courseId: string;
  statusFilter: LabStatus | null;
  setStatusFilter: (v: LabStatus | null) => void;
}) {
  const { data: planning, isLoading } = useCoursePlanning(courseId);

  if (isLoading || !planning) {
    return (
      <>
        <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
        <SkeletonBoard />
      </>
    );
  }

  const total = countLabs(planning);
  const byStatus = countByStatus(planning);

  return (
    <>
      <StatusFilterChips
        value={statusFilter}
        onChange={setStatusFilter}
        counts={byStatus}
        totalCount={total}
      />
      <KanbanBoard
        mode="single"
        courseId={courseId}
        planning={planning}
        statusFilter={statusFilter}
      />
    </>
  );
}

/**
 * Aggregates planning queries across many courses. We use a tiny local
 * Context so each CoursePlanningFetcher (one per courseId) can publish its
 * data into a Map that the parent reads. This keeps each `useCoursePlanning`
 * call a stable, rules-of-hooks-friendly single-call-per-component.
 */
interface SlotMap {
  [courseId: string]: { data: CoursePlanningTree | undefined; dataUpdatedAt: number; isLoading: boolean };
}

const SlotsContext = createContext<{
  slots: SlotMap;
  setSlot: (courseId: string, slot: SlotMap[string]) => void;
} | null>(null);

function MultiCourseBoard({
  courseIds,
  statusFilter,
  setStatusFilter,
}: {
  courseIds: string[];
  statusFilter: LabStatus | null;
  setStatusFilter: (v: LabStatus | null) => void;
}) {
  // Use a Map of slots keyed by courseId so re-renders don't drift.
  const [slots, setSlots] = useState<SlotMap>({});

  function setSlot(courseId: string, slot: SlotMap[string]) {
    setSlots((prev) => (prev[courseId] === slot ? prev : { ...prev, [courseId]: slot }));
  }

  return (
    <SlotsContext.Provider value={{ slots, setSlot }}>
      <MultiCourseContent
        courseIds={courseIds}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </SlotsContext.Provider>
  );
}

function MultiCourseContent({
  courseIds,
  statusFilter,
  setStatusFilter,
}: {
  courseIds: string[];
  statusFilter: LabStatus | null;
  setStatusFilter: (v: LabStatus | null) => void;
}) {
  return (
    <>
      {courseIds.map((id) => (
        <CoursePlanningFetcher key={id} courseId={id} />
      ))}
      <MultiCourseAggregator
        courseIds={courseIds}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </>
  );
}

function CoursePlanningFetcher({ courseId }: { courseId: string }) {
  const { data, isLoading, dataUpdatedAt } = useCoursePlanning(courseId);
  const ctx = useContext(SlotsContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setSlot(courseId, { data, dataUpdatedAt, isLoading });
  }, [ctx, courseId, data, isLoading, dataUpdatedAt]);
  return null;
}

function MultiCourseAggregator({
  courseIds,
  statusFilter,
  setStatusFilter,
}: {
  courseIds: string[];
  statusFilter: LabStatus | null;
  setStatusFilter: (v: LabStatus | null) => void;
}) {
  const ctx = useContext(SlotsContext);
  const slots: SlotMap = ctx?.slots ?? {};

  const entriesAll = useMemo<KanbanLabEntry[]>(() => {
    const out: KanbanLabEntry[] = [];
    for (const id of courseIds) {
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
  }, [courseIds, slots]);

  const byStatusCounts = useMemo(() => {
    const out: Partial<Record<LabStatus, number>> = {};
    for (const e of entriesAll) out[e.lab.status] = (out[e.lab.status] ?? 0) + 1;
    return out;
  }, [entriesAll]);

  // We treat "still loading" as: ANY of the expected course queries is loading.
  // Once everything settles, we can show the proper empty state if needed.
  const isAnyLoading = courseIds.some((id) => slots[id]?.isLoading !== false);
  // Empty only after we've actually loaded every course but found no labs.
  const hasAnyData = courseIds.some((id) => slots[id]?.data);

  return (
    <>
      <StatusFilterChips
        value={statusFilter}
        onChange={setStatusFilter}
        counts={byStatusCounts}
        totalCount={entriesAll.length}
      />
      {entriesAll.length === 0 && !isAnyLoading ? (
        <EmptyState
          title="No labs yet"
          description="Once you add milestones → modules → lab groups → labs in Lab Planning, they will appear here."
          action={
            <Link className="button primary" to="/courses">
              Open Courses
            </Link>
          }
        />
      ) : !hasAnyData ? (
        <SkeletonBoard />
      ) : (
        <KanbanBoard mode="multi" entries={entriesAll} statusFilter={statusFilter} />
      )}
    </>
  );
}

// (No helpers below needed in this component — they live in their own files.)
function countLabs(planning: CoursePlanningTree): number {
  let n = 0;
  for (const m of planning.milestones)
    for (const mod of m.modules) for (const g of mod.labGroups) n += g.labs.length;
  return n;
}

function countByStatus(planning: CoursePlanningTree): Partial<Record<LabStatus, number>> {
  const out: Partial<Record<LabStatus, number>> = {};
  for (const m of planning.milestones) {
    for (const mod of m.modules) {
      for (const g of mod.labGroups) {
        for (const lab of g.labs) {
          out[lab.status] = (out[lab.status] ?? 0) + 1;
        }
      }
    }
  }
  return out;
}

function SkeletonBoard() {
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
          gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {LAB_STATUSES.map((s) => (
          <div key={s} className="card skeleton-card" style={{ minHeight: 240 }}>
            <Skeleton height={16} width="40%" />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={56} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
