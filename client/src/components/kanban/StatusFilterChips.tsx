import { LAB_STATUSES, LAB_STATUS_LABELS } from '../../utils/constants';
import type { LabStatus } from '../../types/domain';

interface Props {
  value: LabStatus | null;
  onChange: (v: LabStatus | null) => void;
  counts?: Partial<Record<LabStatus, number>> | null;
  totalCount?: number;
}

/**
 * Horizontal pill row to quickly filter the kanban by lab status.
 * Pure controlled component — no API.
 */
export default function StatusFilterChips({ value, onChange, counts, totalCount }: Props) {
  return (
    <div className="kanban-status-filter" role="tablist" aria-label="Filter by status">
      <button
        type="button"
        className={`kanban-status-filter__pill ${value === null ? 'is-active' : ''}`}
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        role="tab"
      >
        All{typeof totalCount === 'number' && <span className="count">· {totalCount}</span>}
      </button>
      {LAB_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          className={`kanban-status-filter__pill kanban-status-filter__pill--${s} ${value === s ? 'is-active' : ''}`}
          onClick={() => onChange(value === s ? null : s)}
          aria-pressed={value === s}
          role="tab"
        >
          {LAB_STATUS_LABELS[s]}
          {counts && typeof counts[s] === 'number' && <span className="count">· {counts[s]}</span>}
        </button>
      ))}
    </div>
  );
}
