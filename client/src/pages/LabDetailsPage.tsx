import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteLab,
  useLab,
  useSubmitLab,
  useUpdateLab,
  useUpdateLabStatus,
} from '../hooks/useLab';
import StatusBadge from '../components/common/StatusBadge';
import Spinner from '../components/common/Spinner';
import Breadcrumb from '../components/common/Breadcrumb';
import ResourceViewer from '../components/common/ResourceViewer';
import ActionMenu, { type MenuItem } from '../components/common/ActionMenu';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import ShareButton from '../components/common/ShareButton';
import LabForm from '../components/planning/LabForm';
import LabComments from '../components/lab/LabComments';
import AssignmentPicker from '../components/lab/AssignmentPicker';
import ReviewStages from '../components/lab/ReviewStages';
import { useAuth } from '../hooks/useAuth';
import { ASSIGNMENT_ROLES, LAB_STATUSES, LAB_STATUS_LABELS } from '../utils/constants';
import type { Lab } from '../types/domain';

const LAB_WRITE_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'MINION'];
const LAB_STATUS_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR', 'MINION'];

function mdContentCharCount(s: string) {
  const trimmed = s.trim();
  if (trimmed.length >= 1024) return `${(trimmed.length / 1024).toFixed(1)} KB pasted`;
  return `${trimmed.length} chars pasted`;
}

export default function LabDetailsPage() {
  const { labId = '' } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const { data: lab, isLoading } = useLab(labId);
  const updateStatus = useUpdateLabStatus();
  const update = useUpdateLab();
  const remove = useDeleteLab();
  const submitLab = useSubmitLab();
  const { user } = useAuth();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  // Assignment is handled inline via the always-visible <AssignmentPicker /> card below.
  // No modal state needed.

  // Local state for the minion README editor.
  const [mdDraft, setMdDraft] = useState('');
  const [mdDirty, setMdDirty] = useState(false);
  useEffect(() => {
    if (lab) {
      setMdDraft(lab.mdContent ?? '');
      setMdDirty(false);
    }
  }, [lab]);

  if (isLoading) return <Spinner label="Loading lab..." />;
  if (!lab) return <p>Lab not found.</p>;

  const canEditLab = !!user && LAB_WRITE_ROLES.includes(user.role);
  const canDeleteLab = canEditLab; // deleting a lab uses the same role gate
  const canChangeStatus = !!user && LAB_STATUS_ROLES.includes(user.role);
  const canAssign = !!user && ASSIGNMENT_ROLES.includes(user.role as never);
  const isAssignee = !!user && !!lab.assignedMinionId && user.id === lab.assignedMinionId;
  const isMinion = user?.role === 'MINION';
  // A minion may only edit the lab if they are the assignee.
  const canEditThisLab = canEditLab && (!isMinion || isAssignee);
  const canEditReadme = isAssignee; // only the assignee minion can edit README content

  const hasMdLink = !!(lab.mdLink && lab.mdLink.trim());
  const hasMdContent = !!(lab.mdContent && lab.mdContent.trim());
  const hasMdSource = hasMdLink || hasMdContent;
  const hasSourceLink = !!(lab.sourceLink && lab.sourceLink.trim());

  function handleViewLab() {
    if (!hasMdSource) {
      window.alert('No MD link or pasted README set for this lab.');
      return;
    }
    setViewerOpen(true);
  }

  function handleSeeResource() {
    if (!hasSourceLink) {
      window.alert('No source link set for this lab.');
      return;
    }
    window.open(lab!.sourceLink, '_blank', 'noopener,noreferrer');
  }

  function handleEditSubmit(payload: Partial<Lab>) {
    update.mutate(
      { id: lab!._id, payload },
      { onSuccess: () => setEditOpen(false) },
    );
  }

  function handleDeleteConfirm() {
    remove.mutate(lab!._id, {
      onSuccess: () => navigate('/courses'),
    });
  }

  function handleSaveDraft() {
    if (!isAssignee) return;
    update.mutate(
      { id: lab!._id, payload: { mdContent: mdDraft } },
      { onSuccess: () => setMdDirty(false) },
    );
  }

  function handleSubmitForReview() {
    if (!isAssignee) return;
    // Save draft first, then submit.
    update.mutate(
      { id: lab!._id, payload: { mdContent: mdDraft } },
      {
        onSuccess: () => {
          setMdDirty(false);
          submitLab.mutate(lab!._id);
        },
      },
    );
  }

  const menuItems: MenuItem[] = [
    // === General ===
    ...(hasMdSource
      ? [{ label: 'View README', icon: '📄', onClick: () => setViewerOpen(true) }]
      : []),
    ...(hasSourceLink
      ? [{ label: 'Open source link', icon: '🔗', onClick: handleSeeResource }]
      : []),
    // === Divider before workflow actions ===
    ...((hasMdSource || hasSourceLink) && (canChangeStatus || canEditThisLab || canDeleteLab)
      ? [{ label: '—', divider: true, onClick: () => {} } as MenuItem]
      : []),
    // === Lab document ===
    ...(canChangeStatus
      ? [{ label: 'Set status', icon: '🔁', onClick: () => setStatusPickerOpen(true) }]
      : []),
    ...(canEditThisLab
      ? [{ label: 'Edit lab', icon: '✏️', onClick: () => setEditOpen(true) }]
      : []),
    // === Divider before danger ===
    ...((canChangeStatus || canEditThisLab) && canDeleteLab
      ? [{ label: '—', divider: true, onClick: () => {} } as MenuItem]
      : []),
    // === Danger ===
    ...(canDeleteLab
      ? [{ label: 'Delete lab', icon: '🗑', danger: true, onClick: () => setDeleteOpen(true) }]
      : []),
  ];

  return (
    <>
      <Breadcrumb items={[{ label: 'Courses', to: '/courses' }, { label: 'Lab Details' }]} />

      {/* Header row: title + status + actions */}
      <div className="lab-row" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{lab.title}</h1>
            <StatusBadge status={lab.status} />
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            Lab details and instructions
            {canEditThisLab && ' · You can edit this lab'}
            {isAssignee && ' · You are the assigned minion'}
          </p>
        </div>
        <div className="lab-row-actions">
          <button
            type="button"
            className={`chip ${hasMdSource ? 'primary' : ''}`}
            onClick={handleViewLab}
            disabled={!hasMdSource}
            title={hasMdSource ? 'Open the MD resource viewer' : 'No MD link or pasted README set'}
          >
            <span className="icon" aria-hidden="true">📄</span>
            <span>View lab</span>
          </button>
          {canAssign && (
            <button
              type="button"
              className={`chip ${lab.assignedMinionId ? '' : 'primary'}`}
              onClick={() => {
                // Scroll the inline AssignmentPicker into view and focus the select.
                const el = document.getElementById(`assign-${lab._id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => el.focus(), 250);
                }
              }}
              title={lab.assignedMinionId ? 'Change who this lab is assigned to' : 'Assign this lab to a minion'}
            >
              <span className="icon" aria-hidden="true">👤</span>
              <span>{lab.assignedMinionId ? 'Change assignment' : 'Assign'}</span>
            </button>
          )}
          {menuItems.length > 0 && <ActionMenu items={menuItems} />}
          {hasMdSource && (
            <ShareButton
              kind="LAB_README"
              refId={lab._id}
              label={
                user && ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'].includes(user.role)
                  ? 'Share lab view'
                  : 'Share readme'
              }
              description={
                user && ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'].includes(user.role)
                  ? 'Anyone with the link can view this lab\u2019s readme in their browser. No login required.'
                  : 'Anyone with the link can view this readme in their browser. No login required.'
              }
            />
          )}
        </div>
      </div>

      {/* Assignment strip — visible always, read-only or picker */}
      <div className="card mb-4">
        <AssignmentPicker lab={lab} canManage={canAssign} />
      </div>

      <div className="card mb-4">
        <div className="mb-3">
          <strong>Description</strong>
          <p className="muted mt-3">{lab.description || 'No description.'}</p>
        </div>
        <div className="mb-3">
          <strong>Instructions</strong>
          <pre className="muted mt-3" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {lab.instructions || 'No instructions yet.'}
          </pre>
        </div>
        <div className="mb-3">
          <strong>Estimated Time</strong>
          <p className="muted mt-3">{lab.estimatedTime} minutes</p>
        </div>
        {(hasMdLink || hasMdContent || hasSourceLink) && (
          <div className="mb-3">
            <strong>Links & Sources</strong>
            <ul className="mt-3" style={{ fontSize: 13 }}>
              {hasMdLink && (
                <li>MD link: <a href={lab.mdLink} target="_blank" rel="noopener noreferrer">{lab.mdLink}</a></li>
              )}
              {hasMdContent && (
                <li>Pasted README: {mdContentCharCount(lab.mdContent)}</li>
              )}
              {hasSourceLink && (
                <li>Source: <a href={lab.sourceLink} target="_blank" rel="noopener noreferrer">{lab.sourceLink}</a></li>
              )}
            </ul>
          </div>
        )}
        <div className="muted" style={{ fontSize: 12 }}>
          Created {new Date(lab.createdAt).toLocaleString()} · Updated {new Date(lab.updatedAt).toLocaleString()}
        </div>
      </div>

      {/* Minion README editor — only visible to assigned minion */}
      {canEditReadme && (
        <div className="card mb-4 minion-editor">
          <div className="row mb-3" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="minion-editor__title" style={{ margin: 0 }}>Your README</h2>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                Paste or write your README.md content here. Save a draft anytime, then submit when ready for review.
              </p>
            </div>
            <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {mdContentCharCount(mdDraft)}
            </span>
          </div>
          <textarea
            className="textarea"
            rows={14}
            value={mdDraft}
            onChange={(e) => {
              setMdDraft(e.target.value);
              setMdDirty(true);
            }}
            placeholder="# Lab Title&#10;&#10;Write your README content here...&#10;"
            spellCheck={false}
          />
          <div className="row mt-3" style={{ justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {mdDirty ? 'Unsaved changes' : 'All saved'}
              {lab.submittedAt && ` · last submitted ${new Date(lab.submittedAt).toLocaleString()}`}
            </span>
            <div className="row" style={{ gap: 8 }}>
              <button
                type="button"
                className="button"
                onClick={handleSaveDraft}
                disabled={!mdDirty || update.isPending}
              >
                {update.isPending ? 'Saving…' : 'Save draft'}
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleSubmitForReview}
                disabled={update.isPending || submitLab.isPending}
                title="Save the README and submit this lab for review"
              >
                {submitLab.isPending ? 'Submitting…' : '📤 Submit for review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review stages */}
      <div className="card mb-4">
        <ReviewStages lab={lab} />
      </div>

      <Link to={`/courses`} className="muted">← Back to courses</Link>

      <ResourceViewer
        open={viewerOpen}
        labId={lab._id}
        title={lab.title}
        onClose={() => setViewerOpen(false)}
      />

      <LabComments labId={lab._id} comments={lab.comments ?? []} />

      {/* Edit modal — full LabForm */}
      <Modal
        open={editOpen}
        title="Edit lab"
        onClose={() => setEditOpen(false)}
        wide
      >
        <LabForm
          initial={lab}
          submitting={update.isPending}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Status picker modal */}
      <Modal
        open={statusPickerOpen}
        title="Set status"
        onClose={() => setStatusPickerOpen(false)}
      >
        <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {LAB_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`button ${lab.status === s ? 'primary' : ''}`}
              onClick={() => {
                updateStatus.mutate({ id: lab._id, status: s });
                setStatusPickerOpen(false);
              }}
            >
              {LAB_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this lab?"
        message={`This will permanently remove "${lab.title}". This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
