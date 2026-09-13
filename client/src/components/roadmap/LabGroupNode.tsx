import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import StatusBadge from '../common/StatusBadge';
import type { Lab, LabGroup } from '../../types/domain';
import type { Orient } from './types';

export interface LabGroupNodeData {
  labGroup: LabGroup & { labs: Lab[] };
  orient: Orient;
  [key: string]: unknown;
}

function targetPos(o: Orient): Position {
  return o === 'horizontal' ? Position.Left : Position.Top;
}
function sourcePos(o: Orient): Position {
  return o === 'horizontal' ? Position.Right : Position.Bottom;
}

function LabGroupNodeImpl({ data }: NodeProps) {
  const d = data as unknown as LabGroupNodeData;
  const { labGroup, orient } = d;
  const labs = [...(labGroup.labs ?? [])].sort((a, b) => a.order - b.order);

  const statusColor = `var(--status-${labGroup.status.toLowerCase()}-fg)`;

  // Local expand state — survives re-renders triggered by planning refresh.
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null);

  return (
    <article
      className="node labgroup-node"
      style={{ borderLeftColor: statusColor }}
      data-testid={`labgroup-${labGroup._id}`}
    >
      <Handle type="target" position={targetPos(orient)} className="rf-handle rf-handle-target" />

      <header className="labgroup-node__head">
        <h3 className="node__title">{labGroup.title}</h3>
        <StatusBadge status={labGroup.status} />
      </header>

      {labGroup.description && (
        <p className="node__desc clamp-2">{labGroup.description}</p>
      )}

      <span className="chip node__chip">
        {labs.length} lab{labs.length === 1 ? '' : 's'}
      </span>

      {labs.length === 0 ? (
        <p className="muted labgroup-node__empty">No labs in this group yet.</p>
      ) : (
        <ul className="labgroup-node__labs">
          {labs.map((l) => {
            const isOpen = expandedLabId === l._id;
            return (
              <li key={l._id} className="labgroup-node__lab-item">
                <button
                  type="button"
                  className={`lab-row ${isOpen ? 'is-open' : ''}`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setExpandedLabId(isOpen ? null : l._id);
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`lab-detail-${l._id}`}
                >
                  <span className="lab-row__title">{l.title}</span>
                  <span className="lab-row__meta">
                    {l.estimatedTime ? `${l.estimatedTime}m` : '—'}
                  </span>
                  <StatusBadge status={l.status} />
                  <span className="lab-row__chev" aria-hidden>{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && (
                  <div className="lab-detail" id={`lab-detail-${l._id}`}>
                    {l.description && <p className="lab-detail__desc">{l.description}</p>}
                    {l.instructions && (
                      <pre className="lab-detail__instr">{l.instructions}</pre>
                    )}
                    <div className="lab-detail__meta">
                      <span className="lab-detail__time">
                        {l.estimatedTime || '?'} min
                      </span>
                      <StatusBadge status={l.status} />
                      {l.mdLink && (
                        <a
                          className="chip"
                          href={l.mdLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <span className="icon" aria-hidden>📄</span>
                          <span>Notes</span>
                        </a>
                      )}
                      {l.sourceLink && (
                        <a
                          className="chip"
                          href={l.sourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <span className="icon" aria-hidden>🔗</span>
                          <span>Source</span>
                        </a>
                      )}
                    </div>
                    {!l.description && !l.instructions && !l.mdLink && !l.sourceLink && (
                      <p className="muted">No additional details.</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Handle type="source" position={sourcePos(orient)} className="rf-handle rf-handle-source" />
    </article>
  );
}

const LabGroupNode = memo(LabGroupNodeImpl);
export default LabGroupNode;
