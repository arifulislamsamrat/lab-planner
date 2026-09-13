import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import StatusBadge from '../common/StatusBadge';
import type { LabGroup, ModuleEntity } from '../../types/domain';
import type { Orient } from './types';

export interface ModuleNodeData {
  module: ModuleEntity & { labGroups: LabGroup[] };
  labGroupCount: number;
  orient: Orient;
  onDrillDown: (next: { kind: 'lab-group'; milestoneId: string; moduleId: string }) => void;
  [key: string]: unknown;
}

function targetPos(o: Orient): Position {
  return o === 'horizontal' ? Position.Left : Position.Top;
}
function sourcePos(o: Orient): Position {
  return o === 'horizontal' ? Position.Right : Position.Bottom;
}

function ModuleNodeImpl({ data }: NodeProps) {
  const d = data as unknown as ModuleNodeData;
  const { module: mod, labGroupCount, orient, onDrillDown } = d;
  const statusColor = `var(--status-${mod.status.toLowerCase()}-fg)`;

  function handleClick(ev: React.MouseEvent) {
    ev.stopPropagation();
    onDrillDown({ kind: 'lab-group', milestoneId: mod.milestoneId, moduleId: mod._id });
  }

  function handleKey(ev: React.KeyboardEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onDrillDown({ kind: 'lab-group', milestoneId: mod.milestoneId, moduleId: mod._id });
    }
  }

  return (
    <div
      className="node module-node"
      style={{ borderLeftColor: statusColor }}
      onClick={handleClick}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      aria-label={`Module: ${mod.title}, ${labGroupCount} lab group${labGroupCount === 1 ? '' : 's'}`}
      data-testid={`module-${mod._id}`}
    >
      <Handle type="target" position={targetPos(orient)} className="rf-handle rf-handle-target" />

      <div className="node__head">
        <h3 className="node__title">{mod.title}</h3>
        <StatusBadge status={mod.status} />
      </div>

      {mod.description && (
        <p className="node__desc clamp-2">{mod.description}</p>
      )}

      <span className="chip node__chip">
        {labGroupCount} lab group{labGroupCount === 1 ? '' : 's'} ›
      </span>

      <Handle type="source" position={sourcePos(orient)} className="rf-handle rf-handle-source" />
    </div>
  );
}

const ModuleNode = memo(ModuleNodeImpl);
export default ModuleNode;
