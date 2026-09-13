const Lab = require('../models/Lab');
const LabGroup = require('../models/LabGroup');
const Milestone = require('../models/Milestone');
const Module = require('../models/Module');
const Course = require('../models/Course');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { ASSIGNMENT_ROLES, REVIEWER_ROLES } = require('../utils/constants');

async function ensureLabGroupExists(labGroupId) {
  const exists = await LabGroup.exists({ _id: labGroupId });
  if (!exists) throw new ApiError(404, 'Lab group not found');
}

async function nextOrder(parentQuery) {
  const last = await Lab.findOne(parentQuery).sort({ order: -1 }).select('order').lean();
  return last ? last.order + 1 : 0;
}

async function listByLabGroup(labGroupId) {
  await ensureLabGroupExists(labGroupId);
  return Lab.find({ labGroupId }).sort({ order: 1, createdAt: 1 }).lean();
}

async function getById(id) {
  const lab = await Lab.findById(id).lean();
  if (!lab) throw new ApiError(404, 'Lab not found');
  return lab;
}

async function create(labGroupId, data) {
  await ensureLabGroupExists(labGroupId);
  const order = data.order ?? (await nextOrder({ labGroupId }));
  return Lab.create({ ...data, labGroupId, order });
}

async function update(id, data) {
  const lab = await Lab.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!lab) throw new ApiError(404, 'Lab not found');
  return lab;
}

async function remove(id) {
  const lab = await Lab.findByIdAndDelete(id);
  if (!lab) throw new ApiError(404, 'Lab not found');
  return { ok: true };
}

async function updateStatus(id, status) {
  const lab = await Lab.findById(id);
  if (!lab) throw new ApiError(404, 'Lab not found');
  // Minions must accept their assignment before they may move the lab through
  // statuses. Non-assigners (admin/coordinator/instructor) bypass this check so
  // planning owners can still kick things off.
  // NOTE: the controller/middleware should already verify role; here we just
  // protect the minion case.
  if (
    lab.assignedMinionId &&
    !lab.acceptedByMinionAt &&
    lab.status !== 'DONE'
  ) {
    throw new ApiError(
      409,
      'This lab is awaiting your acceptance. Open it from “My Labs → Awaiting acceptance” and accept before changing the status.',
    );
  }
  lab.status = status;
  await lab.save();
  return lab.toObject();
}

async function reorder(labGroupId, items) {
  await ensureLabGroupExists(labGroupId);
  const ids = items.map((i) => i.id);
  const docs = await Lab.find({ _id: { $in: ids }, labGroupId }).select('_id').lean();
  if (docs.length !== ids.length) throw new ApiError(400, 'Some labs do not belong to this lab group');
  await Promise.all(items.map((i) => Lab.updateOne({ _id: i.id, labGroupId }, { $set: { order: i.order } })));
  return { ok: true };
}

async function reorderAcrossGroups(items) {
  // For Kanban reordering across columns: items include groupId hint
  const ids = items.map((i) => i.id);
  const labs = await Lab.find({ _id: { $in: ids } }).select('_id labGroupId').lean();
  const map = new Map(labs.map((l) => [String(l._id), String(l.labGroupId)]));
  await Promise.all(items.map((i) => {
    const groupId = map.get(String(i.id));
    if (!groupId) return Promise.resolve();
    return Lab.updateOne({ _id: i.id, labGroupId: groupId }, { $set: { order: i.order } });
  }));
  return { ok: true };
}

async function addComment(labId, { userId, userName, body }) {
  const lab = await Lab.findByIdAndUpdate(
    labId,
    { $push: { comments: { userId, userName, body, createdAt: new Date() } } },
    { new: true }
  );
  if (!lab) throw new ApiError(404, 'Lab not found');
  // Return the most recently pushed comment (last in array)
  return lab.comments[lab.comments.length - 1];
}

async function removeComment(labId, commentId, actingUser) {
  const lab = await Lab.findById(labId);
  if (!lab) throw new ApiError(404, 'Lab not found');
  const target = lab.comments.find((c) => String(c._id) === String(commentId));
  if (!target) throw new ApiError(404, 'Comment not found');
  const isAuthor = String(target.userId) === String(actingUser.id);
  const isAdmin = actingUser.role === 'ADMIN';
  if (!isAuthor && !isAdmin) throw new ApiError(403, 'Cannot delete another user\u2019s comment');
  lab.comments = lab.comments.filter((c) => String(c._id) !== String(commentId));
  await lab.save();
  return { ok: true };
}

async function getPlanningTree(courseId) {
  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(404, 'Course not found');

  const milestones = await Milestone.find({ courseId }).sort({ order: 1 }).lean();
  const milestoneIds = milestones.map((m) => m._id);
  const modules = milestoneIds.length
    ? await Module.find({ milestoneId: { $in: milestoneIds } }).sort({ order: 1 }).lean()
    : [];
  const moduleIds = modules.map((m) => m._id);
  const labGroups = moduleIds.length
    ? await LabGroup.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean()
    : [];
  const labGroupIds = labGroups.map((g) => g._id);
  const labs = labGroupIds.length
    ? await Lab.find({ labGroupId: { $in: labGroupIds } }).sort({ order: 1 }).lean()
    : [];

  const labsByGroup = new Map();
  for (const lab of labs) {
    const key = String(lab.labGroupId);
    const arr = labsByGroup.get(key) ?? [];
    arr.push(lab);
    labsByGroup.set(key, arr);
  }

  const groupsByModule = new Map();
  for (const g of labGroups) {
    const key = String(g.moduleId);
    const arr = groupsByModule.get(key) ?? [];
    arr.push({ ...g, labs: labsByGroup.get(String(g._id)) ?? [] });
    groupsByModule.set(key, arr);
  }

  const modulesByMilestone = new Map();
  for (const m of modules) {
    const key = String(m.milestoneId);
    const arr = modulesByMilestone.get(key) ?? [];
    arr.push({ ...m, labGroups: groupsByModule.get(String(m._id)) ?? [] });
    modulesByMilestone.set(key, arr);
  }

  return {
    course,
    milestones: milestones.map((m) => ({ ...m, modules: modulesByMilestone.get(String(m._id)) ?? [] })),
  };
}

// ============================================================================
// Assignment + submission + review workflow
// ============================================================================

async function assertActorRole(actor, allowed, errorMessage) {
  if (!actor || !allowed.includes(actor.role)) {
    throw new ApiError(403, errorMessage);
  }
}

async function ensureLabExists(labId) {
  const lab = await Lab.findById(labId);
  if (!lab) throw new ApiError(404, 'Lab not found');
  return lab;
}

async function assign(labId, minionId, actor) {
  await assertActorRole(actor, ASSIGNMENT_ROLES, 'Only admins or course coordinators can assign labs');
  const lab = await ensureLabExists(labId);
  const minion = await User.findById(minionId);
  if (!minion) throw new ApiError(404, 'Minion not found');
  if (minion.role !== 'MINION') throw new ApiError(400, 'Target user is not a minion');
  if (!minion.isActive) throw new ApiError(400, 'Target minion is inactive');
  lab.assignedMinionId = minion._id;
  lab.assignedAt = new Date();
  await lab.save();
  return lab.toObject();
}

async function unassign(labId, actor) {
  await assertActorRole(actor, ASSIGNMENT_ROLES, 'Only admins or course coordinators can unassign labs');
  const lab = await ensureLabExists(labId);
  lab.assignedMinionId = null;
  lab.assignedAt = null;
  lab.submittedAt = null;
  await lab.save();
  return lab.toObject();
}

async function submit(labId, actor) {
  const lab = await ensureLabExists(labId);
  if (!lab.assignedMinionId || String(lab.assignedMinionId) !== String(actor.id)) {
    throw new ApiError(403, 'Only the assigned minion can submit this lab');
  }
  lab.submittedAt = new Date();
  await lab.save();
  return lab.toObject();
}

/**
 * Minion accepts the assignment. After this, the lab is owned by the minion
 * and they can move its status (BACKLOG → IN_PROGRESS → …).
 * Only the currently-assigned minion may accept. Re-acceptance is allowed
 * (idempotent) so it can also be used to clear a stale acceptedByMinionAt.
 */
async function acceptAssignment(labId, actor) {
  const lab = await ensureLabExists(labId);
  if (actor.role !== 'MINION') {
    throw new ApiError(403, 'Only the assigned minion can accept this lab');
  }
  if (!lab.assignedMinionId || String(lab.assignedMinionId) !== String(actor.id)) {
    throw new ApiError(403, 'This lab is not assigned to you');
  }
  lab.acceptedByMinionAt = new Date();
  await lab.save();
  return lab.toObject();
}

/**
 * Minion declines / rejects an assignment they were given. Clears the
 * assignedMinionId so an admin/coordinator/instructor can re-assign.
 */
async function declineAssignment(labId, actor) {
  const lab = await ensureLabExists(labId);
  if (actor.role !== 'MINION') {
    throw new ApiError(403, 'Only the assigned minion can decline this lab');
  }
  if (!lab.assignedMinionId || String(lab.assignedMinionId) !== String(actor.id)) {
    throw new ApiError(403, 'This lab is not assigned to you');
  }
  lab.assignedMinionId = null;
  lab.assignedAt = null;
  lab.acceptedByMinionAt = null;
  await lab.save();
  return lab.toObject();
}

async function openReviewStage(labId, { feedback }, actor) {
  await assertActorRole(actor, REVIEWER_ROLES, 'Only reviewers can open a review stage');
  if (!feedback || !feedback.trim()) throw new ApiError(400, 'Feedback is required to open a stage');
  const lab = await ensureLabExists(labId);
  const nextStage = (lab.review?.length ?? 0) + 1;
  const now = new Date();
  lab.review.push({
    stage: nextStage,
    reviewerId: actor.id,
    reviewerName: actor.name,
    status: 'OPEN',
    feedback: feedback.trim(),
    openedAt: now,
    resolvedAt: null,
  });
  // Reopen from DONE is allowed. In any case we set REVIEW (covers both normal
  // submission flow and the "reopen any time" rule).
  lab.status = 'REVIEW';
  lab.acceptedAt = null;
  await lab.save();
  return lab.toObject();
}

async function resolveReviewStage(labId, stageId, actor) {
  await assertActorRole(actor, REVIEWER_ROLES, 'Only reviewers can resolve stages');
  const lab = await ensureLabExists(labId);
  const stage = lab.review.id(stageId);
  if (!stage) throw new ApiError(404, 'Review stage not found');
  if (stage.status === 'RESOLVED') return lab.toObject();
  stage.status = 'RESOLVED';
  stage.resolvedAt = new Date();
  await lab.save();
  return lab.toObject();
}

async function acceptLab(labId, actor) {
  await assertActorRole(actor, REVIEWER_ROLES, 'Only reviewers can accept a lab');
  const lab = await ensureLabExists(labId);
  const hasOpen = (lab.review ?? []).some((s) => s.status === 'OPEN');
  if (hasOpen) {
    throw new ApiError(400, 'All review stages must be resolved before accepting the lab');
  }
  const now = new Date();
  // Resolve any not-yet-closed stages defensively (shouldn't happen but safe).
  for (const s of lab.review ?? []) {
    if (s.status !== 'RESOLVED') {
      s.status = 'RESOLVED';
      s.resolvedAt = now;
    }
  }
  lab.status = 'DONE';
  lab.acceptedAt = now;
  await lab.save();
  return lab.toObject();
}

/**
 * List labs visible to the acting user grouped by the requested tab.
 * - MINION: only their own assigned labs.
 * - INSTRUCTOR: labs they have reviewed (any review stage opened by them).
 * - COURSE_COORDINATOR / ADMIN: all labs.
 */
async function listMyLabs(user, tab = 'all') {
  let baseQuery = {};
  if (user.role === 'MINION') {
    baseQuery.assignedMinionId = user.id;
  } else if (user.role === 'INSTRUCTOR') {
    baseQuery['review.reviewerId'] = user.id;
  }
  // coord/admin → no extra filter.

  let labs = await Lab.find(baseQuery).sort({ updatedAt: -1 }).lean();

  // Apply tab filter on top of base visibility scope.
  const normalizeTab = (t) => {
    if (t === 'awaiting') return 'awaiting';
    if (t === 'in_review') return 'in_review';
    if (t === 'finished') return 'finished';
    if (t === 'pending') return 'pending';
    return 'all';
  };
  const t = normalizeTab(tab);

  // For minion we filter by assignee==user; for instructor/coord/admin we
  // *also* require an assignee context for pending/in_review/finished
  // because those tabs are about a specific lab's lifecycle.
  const isMyLifecycleView = ['MINION'].includes(user.role);
  if (isMyLifecycleView || ['COURSE_COORDINATOR', 'ADMIN'].includes(user.role)) {
    // Awaiting acceptance: assigned but minion has not accepted yet.
    if (t === 'awaiting') {
      labs = labs.filter(
        (l) => l.assignedMinionId && !l.acceptedByMinionAt && l.status !== 'DONE',
      );
    } else if (t === 'pending') {
      // Pending = accepted and (no open stage) and not done.
      labs = labs.filter(
        (l) =>
          l.assignedMinionId &&
          l.acceptedByMinionAt &&
          !(l.review ?? []).some((s) => s.status === 'OPEN') &&
          l.status !== 'DONE',
      );
    } else if (t === 'in_review') {
      labs = labs.filter(
        (l) => l.assignedMinionId && ((l.review ?? []).some((s) => s.status === 'OPEN') || l.status === 'REVIEW'),
      );
    } else if (t === 'finished') {
      labs = labs.filter((l) => l.assignedMinionId && l.status === 'DONE');
    }
    // 'all' keeps baseQuery
  } else if (user.role === 'INSTRUCTOR') {
    // For instructors: tabs reflect THEIR reviewed labs.
    if (t === 'awaiting') {
      // Instructors don't really have "awaiting acceptance" — keep empty.
      labs = [];
    } else if (t === 'pending') {
      labs = labs.filter(
        (l) =>
          l.assignedMinionId &&
          !(l.review ?? []).some((s) => s.status === 'OPEN') &&
          l.status !== 'DONE',
      );
    } else if (t === 'in_review') {
      labs = labs.filter(
        (l) => (l.review ?? []).some((s) => s.status === 'OPEN') || l.status === 'REVIEW',
      );
    } else if (t === 'finished') {
      labs = labs.filter((l) => l.status === 'DONE');
    }
    // 'all' keeps baseQuery
  }

  return labs;
}

module.exports = {
  listByLabGroup,
  getById,
  create,
  update,
  remove,
  updateStatus,
  reorder,
  reorderAcrossGroups,
  getPlanningTree,
  addComment,
  removeComment,
  assign,
  unassign,
  submit,
  acceptAssignment,
  declineAssignment,
  openReviewStage,
  resolveReviewStage,
  acceptLab,
  listMyLabs,
};