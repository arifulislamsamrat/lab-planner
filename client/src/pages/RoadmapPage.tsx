import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../hooks/useCourses';
import { useCoursePlanning } from '../hooks/useCoursePlanning';
import Breadcrumb from '../components/common/Breadcrumb';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import RoadmapFlow from '../components/roadmap/RoadmapFlow';
import RoadmapBreadcrumb from '../components/roadmap/RoadmapBreadcrumb';
import type { BreadcrumbSegment, DrillTarget, Level } from '../components/roadmap/types';

function milestoneCode(ms: { order: number; _id: string }): string {
  return `M${String(ms.order + 1).padStart(2, '0')}`;
}

function moduleCode(mod: { order: number; _id: string }): string {
  return `Mod${String(mod.order + 1).padStart(2, '0')}`;
}

function labGroupCode(lg: { order: number; _id: string }): string {
  return `LG${String(lg.order + 1).padStart(2, '0')}`;
}

export default function RoadmapPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: planning, isLoading: planningLoading } = useCoursePlanning(courseId);

  const [history, setHistory] = useState<Level[]>([{ kind: 'milestone' }]);
  const current = history[history.length - 1];

  const drill = useCallback((target: DrillTarget) => {
    setHistory((h) => {
      const next: Level =
        target.kind === 'module'
          ? { kind: 'module', milestoneId: target.milestoneId }
          : { kind: 'lab-group', milestoneId: target.milestoneId, moduleId: target.moduleId };
      return [...h, next];
    });
  }, []);

  const jumpTo = useCallback((levelIdx: number) => {
    setHistory((h) => (levelIdx >= 0 ? h.slice(0, levelIdx + 1) : h));
  }, []);

  const goBack = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && history.length > 1) {
        goBack();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [history.length, goBack]);

  const segments = useMemo<BreadcrumbSegment[]>(() => {
    if (!course) return [];
    const out: BreadcrumbSegment[] = [{ label: course.title, levelIdx: 0 }];
    if (current.kind === 'milestone') return out;

    const ms = planning?.milestones.find((m) => m._id === current.milestoneId);
    out.push({
      label: ms ? `${milestoneCode(ms)} · ${ms.title}` : 'Milestone',
      levelIdx: 1,
    });

    if (current.kind === 'lab-group' && ms) {
      const mod = ms.modules.find((m) => m._id === current.moduleId);
      out.push({
        label: mod ? `${moduleCode(mod)} · ${mod.title}` : 'Module',
        levelIdx: 2,
      });
    }

    return out;
  }, [course, planning, current]);

  const stats = useMemo(() => {
    if (!planning) return { milestones: 0, modules: 0, groups: 0, labs: 0 };
    const modules = planning.milestones.reduce((s, m) => s + m.modules.length, 0);
    const groups = planning.milestones.reduce(
      (s, m) => s + m.modules.reduce((g, mod) => g + mod.labGroups.length, 0),
      0,
    );
    const labs = planning.milestones.reduce(
      (s, m) =>
        s + m.modules.reduce(
          (g, mod) => g + mod.labGroups.reduce((cnt, lg) => cnt + lg.labs.length, 0),
          0,
        ),
      0,
    );
    return { milestones: planning.milestones.length, modules, groups, labs };
  }, [planning]);

  if (courseLoading || planningLoading) return <Spinner label="Loading roadmap..." />;
  if (!course || !planning) return <p>Course not found.</p>;

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Courses', to: '/courses' },
          { label: course.title, to: `/courses/${course._id}` },
          { label: 'Roadmap' },
        ]}
      />
      <div className="toolbar">
        <div>
          <h1 className="page-title">{course.title}</h1>
          <p className="page-subtitle">
            {current.kind === 'milestone' &&
              `Roadmap — ${stats.milestones} milestone${stats.milestones === 1 ? '' : 's'} in order from start to capstone.`}
            {current.kind === 'module' &&
              `Modules inside this milestone — click to see lab groups.`}
            {current.kind === 'lab-group' &&
              `Lab groups & labs inside this module.`}
          </p>
        </div>
        <div className="toolbar-right">
          <Link className="chip primary" to={`/courses/${courseId}/lab-planning`}>
            <span className="icon" aria-hidden="true">📋</span>
            <span>Open Lab Planning</span>
          </Link>
        </div>
      </div>

      <RoadmapBreadcrumb segments={segments} onJumpTo={jumpTo} />

      <div className="roadmap-summary">
        <SummaryStat label="Milestones" value={stats.milestones} />
        <SummaryStat label="Modules" value={stats.modules} />
        <SummaryStat label="Lab Groups" value={stats.groups} />
        <SummaryStat label="Labs" value={stats.labs} />
        <div className="stat">
          <div className="label">Course</div>
          <div className="value">
            <StatusBadge status={course.status} />
          </div>
        </div>
      </div>

      {planning.milestones.length === 0 ? (
        <EmptyState
          title="No milestones yet"
          description="Create your first milestone in Lab Planning to start building the roadmap."
          action={
            <Link className="button primary" to={`/courses/${courseId}/lab-planning`}>
              Go to Lab Planning
            </Link>
          }
        />
      ) : (
        <RoadmapFlow
          planning={planning}
          level={current}
          milestoneCode={milestoneCode}
          moduleCode={moduleCode}
          labGroupCode={labGroupCode}
          onDrillDown={drill}
          courseStatus={course.status}
        />
      )}
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
