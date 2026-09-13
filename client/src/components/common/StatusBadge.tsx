import { LAB_STATUS_LABELS, ITEM_STATUS_LABELS, LAB_REVIEW_STATUS_LABELS } from '../../utils/constants';
import type { LabStatus, CourseStatus, LabReviewStatus } from '../../types/domain';

type Props = {
  status: LabStatus | CourseStatus | LabReviewStatus | (string & {});
  label?: string;
};

export default function StatusBadge({ status, label }: Props) {
  const display =
    label ??
    (LAB_STATUS_LABELS as Record<string, string>)[status] ??
    (LAB_REVIEW_STATUS_LABELS as Record<string, string>)[status] ??
    (ITEM_STATUS_LABELS as Record<string, string>)[status] ??
    (status as string).replace(/_/g, ' ');
  return <span className={`status-badge status-${status}`}>{display}</span>;
}
