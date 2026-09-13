import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import StatusBadge from '../common/StatusBadge';
import type { Milestone, ModuleEntity } from '../../types/domain';
import type { Orient } from './types';

export interface MilestoneNodeData {
  milestone: Milestone & { modules: ModuleEntity[] };
  moduleCount: number;
  isCapstone: boolean;
  orient: Orient;
  onDrillDown: (next: { kind: 'module'; milestoneId: string }) => void;
  [key: string]: unknown;
}

function targetPos(o: Orient): Position {
  return o === 'horizontal' ? Position.Left : Position.Top;
}
function sourcePos(o: Orient): Position {
  return o === 'horizontal' ? Position.Right : Position.Bottom;
}

function MilestoneNodeImpl({ data }: NodeProps) {
  const d = data as unknown as MilestoneNodeData;
  const { milestone, moduleCount, isCapstone, orient, onDrillDown } = d;
  const statusColor = `var(--status-${milestone.status.toLowerCase()}-fg)`;

  function handleClick(ev: React.MouseEvent) {
    ev.stopPropagation();
    onDrillDown({ kind: 'module', milestoneId: milestone._id });
  }

  function handleKey(ev: React.KeyboardEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onDrillDown({ kind: 'module', milestoneId: milestone._id });
    }
  }

  return (
    <div
      className="node milestone-node"
      style={{ borderLeftColor: statusColor }}
      onClick={handleClick}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      aria-label={`Milestone: ${milestone.title}, ${moduleCount} module${moduleCount === 1 ? '' : 's'}`}
      data-testid={`milestone-${milestone._id}`}
    >
      <Handle type="target" position={targetPos(orient)} className="rf-handle rf-handle-target" />

      {isCapstone && (
        <span className="chip capstone" title="Final milestone">🏆 Capstone</span>
      )}

      <div className="node__head">
        <h3 className="node__title">{milestone.title}</h3>
        <StatusBadge status={milestone.status} />
      </div>

      {milestone.description && (
        <p className="node__desc clamp-2">{milestone.description}</p>
      )}

      <span className="chip node__chip">
        {moduleCount} module{moduleCount === 1 ? '' : 's'} ›
      </span>

      <Handle type="source" position={sourcePos(orient)} className="rf-handle rf-handle-source" />
    </div>
  );
}

const MilestoneNode = memo(MilestoneNodeImpl);
export default MilestoneNode;
