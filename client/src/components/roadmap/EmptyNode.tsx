import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface EmptyNodeData {
  message: string;
  hint?: string;
  [key: string]: unknown;
}

function EmptyNodeImpl({ data }: NodeProps) {
  const d = data as unknown as EmptyNodeData;
  return (
    <div className="node empty-card-node" role="status">
      <div className="empty-card-node__icon" aria-hidden>📭</div>
      <div className="empty-card-node__title">{d.message}</div>
      {d.hint && <div className="empty-card-node__hint">{d.hint}</div>}
    </div>
  );
}

const EmptyNode = memo(EmptyNodeImpl);
export default EmptyNode;
