import { useState } from 'react';
import type { CoursePlanningTree, CourseStatus, Lab, LabGroup, ModuleEntity, Milestone } from '../../types/domain';
import StatusBadge from '../common/StatusBadge';
import type { DrillTarget, Level } from './types';

interface Props {
  planning: CoursePlanningTree;
  level: Level;
  milestoneCode: (ms: { order: number; _id: string }) => string;
  moduleCode: (mod: { order: number; _id: string }) => string;
  labGroupCode: (lg: { order: number; _id: string }) => string;
  onDrillDown: (next: DrillTarget) => void;
  courseStatus: CourseStatus;
}

// roadmap.sh-style icons per item — picked by index modulo.
const ICON_SET = ['🚀', '🎯', '🧭', '⚡', '🛠️', '🧪', '📦', '🔧', '🧱', '🌐', '🧠', '🪄', '🧰', '⚙️', '🪐', '🧮', '🪛', '🪤', '🪞', '🛰️'];

function pickIcon(i: number, fallback: string): string {
  return ICON_SET[i % ICON_SET.length] ?? fallback;
}

// ============================================================================
// RoadmapFlow — vertical roadmap.sh-style flow.
// L1: milestones (zigzag centered) → click drills to L2 (modules in milestone).
// L2: modules (zigzag centered) → click drills to L3.
// L3: lab groups (zigzag centered) → each card lists labs; click lab expands.
// ============================================================================
export default function RoadmapFlow({
  planning,
  level,
  milestoneCode,
  moduleCode,
  labGroupCode,
  onDrillDown,
}: Props) {
  if (level.kind === 'milestone') {
    const ms = [...planning.milestones].sort((a, b) => a.order - b.order || a._id.localeCompare(b._id));
    return (
      <div className="roadmap-flow" data-side="alternating">
        {ms.map((m, i) => (
          <FlowStep
            key={m._id}
            index={i}
            total={ms.length}
            isLast={i === ms.length - 1}
            isFirst={i === 0}
            code={milestoneCode(m)}
            title={m.title}
            description={m.description}
            status={m.status}
            icon={pickIcon(i, '🚀')}
            badge={i === ms.length - 1 && ms.length > 1 ? '🏆 Capstone' : null}
            primary={`${m.modules.length} module${m.modules.length === 1 ? '' : 's'}`}
            onClick={() => onDrillDown({ kind: 'module', milestoneId: m._id })}
            ariaLabel={`Milestone: ${m.title}`}
          />
        ))}
      </div>
    );
  }

  if (level.kind === 'module') {
    const ms = planning.milestones.find((m) => m._id === level.milestoneId);
    const mods = ms ? [...ms.modules].sort((a, b) => a.order - b.order || a._id.localeCompare(b._id)) : [];
    if (mods.length === 0) return <p className="muted roadmap-empty">No modules in this milestone yet.</p>;
    return (
      <div className="roadmap-flow" data-side="alternating">
        {mods.map((mod, i) => (
          <FlowStep
            key={mod._id}
            index={i}
            total={mods.length}
            isLast={i === mods.length - 1}
            isFirst={i === 0}
            code={moduleCode(mod)}
            title={mod.title}
            description={mod.description}
            status={mod.status}
            icon={pickIcon(i, '🧱')}
            badge={null}
            primary={`${mod.labGroups.length} lab group${mod.labGroups.length === 1 ? '' : 's'}`}
            onClick={() => onDrillDown({ kind: 'lab-group', milestoneId: mod.milestoneId, moduleId: mod._id })}
            ariaLabel={`Module: ${mod.title}`}
          />
        ))}
      </div>
    );
  }

  // level.kind === 'lab-group'
  const ms = planning.milestones.find((m) => m._id === level.milestoneId);
  const mod = ms?.modules.find((m) => m._id === level.moduleId);
  const groups = mod ? [...mod.labGroups].sort((a, b) => a.order - b.order || a._id.localeCompare(b._id)) : [];
  if (groups.length === 0) return <p className="muted roadmap-empty">No lab groups in this module yet.</p>;
  return (
    <div className="roadmap-flow" data-side="alternating">
      {groups.map((g, i) => (
        <LabGroupStep
          key={g._id}
          index={i}
          total={groups.length}
          isLast={i === groups.length - 1}
          isFirst={i === 0}
          code={labGroupCode(g)}
          labGroup={g}
          icon={pickIcon(i, '🧪')}
        />
      ))}
    </div>
  );
}

// ============================================================================
// FlowStep — a single roadmap.sh-style step: node badge on the spine, card on
// alternating side, connector line between consecutive steps.
// ============================================================================
interface StepProps {
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  code: string;
  title: string;
  description?: string;
  status: string;
  icon: string;
  badge: string | null;
  primary: string;
  onClick: () => void;
  ariaLabel: string;
}

function FlowStep({
  index,
  isFirst,
  isLast,
  code,
  title,
  description,
  status,
  icon,
  badge,
  primary,
  onClick,
  ariaLabel,
}: StepProps) {
  const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
  const statusColor = `var(--status-${status.toLowerCase()}-fg)`;

  return (
    <div
      className={`flow-step flow-step--${side} ${isFirst ? 'flow-step--first' : ''} ${isLast ? 'flow-step--last' : ''}`}
      data-index={index}
    >
      {/* Connector + node circle sit on the central spine. */}
      <div className="flow-spine" aria-hidden="true">
        {!isFirst && <div className="flow-connector flow-connector--top" />}
        <div className="flow-node" style={{ background: statusColor, color: '#fff' }}>
          <span className="flow-node__icon" aria-hidden>{icon}</span>
          <span className="flow-node__code">{code}</span>
        </div>
        {!isLast && <div className="flow-connector flow-connector--bottom" />}
      </div>

      {/* Card on the side */}
      <button
        type="button"
        className="flow-card"
        onClick={onClick}
        aria-label={ariaLabel}
        style={{ borderLeftColor: statusColor }}
      >
        {badge && <span className="flow-card__badge">{badge}</span>}
        <div className="flow-card__head">
          <h3 className="flow-card__title">{title}</h3>
          <StatusBadge status={status} />
        </div>
        {description && <p className="flow-card__desc clamp-3">{description}</p>}
        <div className="flow-card__foot">
          <span className="chip">{primary} ›</span>
        </div>
      </button>
    </div>
  );
}

// ============================================================================
// LabGroupStep — same shape as FlowStep, but the right-side panel is a
// non-clickable article listing the lab group's labs (click to expand).
// ============================================================================
interface LabStepProps {
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  code: string;
  labGroup: LabGroup & { labs: Lab[] };
  icon: string;
}

function LabGroupStep({ index, isFirst, isLast, code, labGroup, icon }: LabStepProps) {
  const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
  const statusColor = `var(--status-${labGroup.status.toLowerCase()}-fg)`;
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null);
  const labs = [...(labGroup.labs ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div
      className={`flow-step flow-step--${side} ${isFirst ? 'flow-step--first' : ''} ${isLast ? 'flow-step--last' : ''}`}
      data-index={index}
    >
      <div className="flow-spine" aria-hidden="true">
        {!isFirst && <div className="flow-connector flow-connector--top" />}
        <div className="flow-node" style={{ background: statusColor, color: '#fff' }}>
          <span className="flow-node__icon" aria-hidden>{icon}</span>
          <span className="flow-node__code">{code}</span>
        </div>
        {!isLast && <div className="flow-connector flow-connector--bottom" />}
      </div>

      <article className="flow-card flow-card--article" style={{ borderLeftColor: statusColor }}>
        <div className="flow-card__head">
          <h3 className="flow-card__title">{labGroup.title}</h3>
          <StatusBadge status={labGroup.status} />
        </div>
        {labGroup.description && <p className="flow-card__desc clamp-3">{labGroup.description}</p>}

        <div className="flow-card__foot">
          <span className="chip">{labs.length} lab{labs.length === 1 ? '' : 's'}</span>
        </div>

        {labs.length === 0 ? (
          <p className="muted flow-card__empty">No labs in this group yet.</p>
        ) : (
          <ul className="flow-labs">
            {labs.map((l) => {
              const isOpen = expandedLabId === l._id;
              return (
                <li key={l._id}>
                  <button
                    type="button"
                    className={`lab-row ${isOpen ? 'is-open' : ''}`}
                    onClick={() => setExpandedLabId(isOpen ? null : l._id)}
                    aria-expanded={isOpen}
                  >
                    <span className="lab-row__title">{l.title}</span>
                    <span className="lab-row__meta">{l.estimatedTime ? `${l.estimatedTime}m` : '—'}</span>
                    <StatusBadge status={l.status} />
                    <span className="lab-row__chev" aria-hidden>{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className="lab-detail">
                      {l.description && <p className="lab-detail__desc">{l.description}</p>}
                      {l.instructions && <pre className="lab-detail__instr">{l.instructions}</pre>}
                      <div className="lab-detail__meta">
                        <span className="lab-detail__time">{l.estimatedTime || '?'} min</span>
                        <StatusBadge status={l.status} />
                        {l.mdLink && (
                          <a className="chip" href={l.mdLink} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}>
                            <span className="icon" aria-hidden>📄</span>
                            <span>Notes</span>
                          </a>
                        )}
                        {l.sourceLink && (
                          <a className="chip" href={l.sourceLink} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}>
                            <span className="icon" aria-hidden>🔗</span>
                            <span>Source</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}

// Suppress unused import warning in TS strict builds.
export type { Milestone, ModuleEntity };
