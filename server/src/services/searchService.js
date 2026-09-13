/**
 * Global search across Labs, Milestones, Modules.
 *
 * Title-only, case-insensitive, anchored substring match (no regex on user input —
 * the input is escaped before being used as a Mongo $regex source so ReDoS / injection
 * isn't an issue at this scale).
 *
 * Role scoping for labs mirrors `labService.listMyLabs`:
 *   - MINION      → only labs assigned to them.
 *   - INSTRUCTOR  → only labs they have reviewed (any review stage).
 *   - ADMIN / COURSE_COORDINATOR → no extra filter.
 *
 * Milestones and Modules are not role-scoped today (the planning tree is visible
 * to any authed user), so this service matches that behaviour. Each result also
 * includes the parent `courseId` so the client can deep-link to
 * /courses/:courseId/lab-planning for non-lab hits.
 */

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Lab = require('../models/Lab');
const Milestone = require('../models/Milestone');
const Module = require('../models/Module');

function buildTitleRegex(q) {
  // Anchor at start for predictable, fast matching; escape user input.
  return new RegExp('^' + escapeRegex(q), 'i');
}

function labScopeFor(user) {
  if (user.role === 'MINION') return { assignedMinionId: user.id };
  if (user.role === 'INSTRUCTOR') return { 'review.reviewerId': user.id };
  return {};
}

/**
 * Returns:
 *   {
 *     labs:      [{ id, title, courseId, milestoneId?, moduleId?, labGroupId, status }],
 *     milestones:[{ id, title, courseId }],
 *     modules:   [{ id, title, courseId, milestoneId }],
 *   }
 *
 * `courseId` is included on every result so the client can build a deep link
 * to /courses/:courseId/lab-planning.
 */
async function globalSearch(user, rawQ, limit = 8) {
  const q = String(rawQ || '').trim();
  if (!q) return { labs: [], milestones: [], modules: [] };

  const regex = buildTitleRegex(q);
  const cap = Math.max(1, Math.min(20, Number(limit) || 8));

  // --- Labs ---
  const labScope = labScopeFor(user);
  const labDocs = await Lab.find(
    { ...labScope, title: regex },
    { title: 1, status: 1, labGroupId: 1 },
  )
    .sort({ updatedAt: -1 })
    .limit(cap)
    .lean();

  // Resolve labGroup → module → milestone → course chain for deep links.
  // We do this with a single batched query per level to avoid N+1.
  let labs = [];
  if (labDocs.length > 0) {
    const LabGroup = require('../models/LabGroup');
    const labGroupIds = [...new Set(labDocs.map((l) => String(l.labGroupId)))];
    const labGroups = await LabGroup.find(
      { _id: { $in: labGroupIds } },
      { moduleId: 1 },
    ).lean();
    const lgById = new Map(labGroups.map((g) => [String(g._id), g]));
    const moduleIds = [
      ...new Set(
        labGroups.map((g) => (g.moduleId ? String(g.moduleId) : null)).filter(Boolean),
      ),
    ];
    const modules =
      moduleIds.length > 0
        ? await Module.find({ _id: { $in: moduleIds } }, { milestoneId: 1 }).lean()
        : [];
    const modById = new Map(modules.map((m) => [String(m._id), m]));
    const milestoneIds = [
      ...new Set(
        modules.map((m) => (m.milestoneId ? String(m.milestoneId) : null)).filter(Boolean),
      ),
    ];
    const milestones =
      milestoneIds.length > 0
        ? await Milestone.find({ _id: { $in: milestoneIds } }, { courseId: 1 }).lean()
        : [];
    const msById = new Map(milestones.map((m) => [String(m._id), m]));

    labs = labDocs.map((l) => {
      const lg = lgById.get(String(l.labGroupId));
      const mod = lg ? modById.get(String(lg.moduleId)) : null;
      const ms = mod ? msById.get(String(mod.milestoneId)) : null;
      return {
        id: String(l._id),
        title: l.title,
        status: l.status,
        labGroupId: String(l.labGroupId),
        moduleId: lg ? String(lg.moduleId) : null,
        milestoneId: mod ? String(mod.milestoneId) : null,
        courseId: ms ? String(ms.courseId) : null,
      };
    });
  }

  // --- Milestones ---
  const milestoneDocs = await Milestone.find({ title: regex }, { title: 1, courseId: 1 })
    .sort({ updatedAt: -1 })
    .limit(cap)
    .lean();
  const milestones = milestoneDocs.map((m) => ({
    id: String(m._id),
    title: m.title,
    courseId: m.courseId ? String(m.courseId) : null,
  }));

  // --- Modules ---
  const moduleDocs = await Module.find({ title: regex }, { title: 1, milestoneId: 1 })
    .sort({ updatedAt: -1 })
    .limit(cap)
    .lean();
  // Resolve parent course for modules.
  let modules = [];
  if (moduleDocs.length > 0) {
    const parentMsIds = [
      ...new Set(
        moduleDocs.map((m) => (m.milestoneId ? String(m.milestoneId) : null)).filter(Boolean),
      ),
    ];
    const parents =
      parentMsIds.length > 0
        ? await Milestone.find({ _id: { $in: parentMsIds } }, { courseId: 1 }).lean()
        : [];
    const parentById = new Map(parents.map((p) => [String(p._id), p]));
    modules = moduleDocs.map((m) => {
      const parent = m.milestoneId ? parentById.get(String(m.milestoneId)) : null;
      return {
        id: String(m._id),
        title: m.title,
        milestoneId: m.milestoneId ? String(m.milestoneId) : null,
        courseId: parent ? String(parent.courseId) : null,
      };
    });
  }

  return { labs, milestones, modules };
}

module.exports = { globalSearch };
