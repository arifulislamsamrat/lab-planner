/**
 * Share creation + revocation + public lookup.
 *
 * Role policy (enforced at creation time, not on the public routes — the
 * public routes are open by design):
 *
 *   - LAB_README      → ADMIN, COURSE_COORDINATOR, INSTRUCTOR, MINION (anyone authed)
 *   - COURSE_ROADMAP  → ADMIN, COURSE_COORDINATOR, INSTRUCTOR
 *
 * Public lookup checks `kind` against the requested endpoint AND verifies the
 * underlying entity still exists. Bad token / wrong kind / revoked / missing
 * entity → 404 (no existence leak).
 */

const crypto = require('crypto');
const PublicShare = require('../models/PublicShare');
const Lab = require('../models/Lab');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

const ROADMAP_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'];

function generateToken() {
  // 32 url-safe chars. crypto-grade randomness; unguessable.
  return crypto.randomBytes(24).toString('base64url');
}

function assertCanCreate(user, kind) {
  if (kind === 'COURSE_ROADMAP' && !ROADMAP_ROLES.includes(user.role)) {
    throw new ApiError(403, 'You are not allowed to create this kind of share.');
  }
  // LAB_README is open to all authenticated roles.
}

async function assertRefExists(kind, refId) {
  if (kind === 'LAB_README') {
    const lab = await Lab.findById(refId).select('_id').lean();
    if (!lab) throw new ApiError(404, 'Lab not found');
  } else if (kind === 'COURSE_ROADMAP') {
    const course = await Course.findById(refId).select('_id').lean();
    if (!course) throw new ApiError(404, 'Course not found');
  }
}

async function create(user, { kind, refId }) {
  assertCanCreate(user, kind);
  await assertRefExists(kind, refId);
  const token = generateToken();
  const doc = await PublicShare.create({
    token,
    kind,
    refId,
    createdBy: user.id,
  });
  // Return the token only at creation time.
  return {
    id: String(doc._id),
    token: doc.token,
    kind: doc.kind,
    refId: String(doc.refId),
    createdAt: doc.createdAt,
  };
}

async function list(user, { kind, refId } = {}) {
  // For listing, restrict to shares created by the current user.
  // Admins/coordinators could see all, but per the product spec we keep it scoped.
  const q = { createdBy: user.id, revokedAt: null };
  if (kind) q.kind = kind;
  if (refId) q.refId = refId;
  const docs = await PublicShare.find(q).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    token: d.token,
    kind: d.kind,
    refId: String(d.refId),
    createdAt: d.createdAt,
  }));
}

async function revoke(user, id) {
  // Only the creator (or an admin) may revoke.
  const doc = await PublicShare.findById(id);
  if (!doc) throw new ApiError(404, 'Share not found');
  if (String(doc.createdBy) !== String(user.id) && user.role !== 'ADMIN') {
    throw new ApiError(403, 'You are not allowed to revoke this share.');
  }
  if (doc.revokedAt) {
    return { id: String(doc._id), revoked: true };
  }
  doc.revokedAt = new Date();
  await doc.save();
  return { id: String(doc._id), revoked: true };
}

async function lookupPublicReadme(token) {
  const share = await PublicShare.findOne({ token, kind: 'LAB_README' }).lean();
  if (!share || share.revokedAt) throw new ApiError(404, 'Not found');
  const lab = await Lab.findById(share.refId).lean();
  if (!lab) throw new ApiError(404, 'Not found');
  const { renderLabReadme } = require('./resourceRenderService');
  const rendered = await renderLabReadme(lab);
  return {
    labId: String(lab._id),
    title: rendered.title,
    source: rendered.source,
    html: rendered.html,
    requestedUrl: rendered.requestedUrl,
    fetchedUrl: rendered.fetchedUrl,
    contentType: rendered.contentType,
    sourceLink: lab.sourceLink || '',
  };
}

async function lookupPublicRoadmap(token) {
  const share = await PublicShare.findOne({ token, kind: 'COURSE_ROADMAP' }).lean();
  if (!share || share.revokedAt) throw new ApiError(404, 'Not found');
  const course = await Course.findById(share.refId).lean();
  if (!course) throw new ApiError(404, 'Not found');

  // Reuse getPlanningTree so the public roadmap exactly matches the in-app
  // roadmap view (read-only). Defined in labService to avoid circular deps.
  const { getPlanningTree } = require('./labService');
  const tree = await getPlanningTree(String(course._id));
  // Strip any non-public fields if getPlanningTree ever adds them later.
  return {
    course: {
      id: String(tree.course._id),
      title: tree.course.title,
      description: tree.course.description || '',
      status: tree.course.status,
    },
    milestones: tree.milestones.map((m) => ({
      id: String(m._id),
      title: m.title,
      description: m.description || '',
      order: m.order,
      status: m.status,
      modules: (m.modules || []).map((mod) => ({
        id: String(mod._id),
        title: mod.title,
        description: mod.description || '',
        order: mod.order,
        status: mod.status,
        labGroups: (mod.labGroups || []).map((g) => ({
          id: String(g._id),
          title: g.title,
          description: g.description || '',
          order: g.order,
          status: g.status,
          labs: (g.labs || []).map((l) => ({
            id: String(l._id),
            title: l.title,
            description: l.description || '',
            order: l.order,
            status: l.status,
            estimatedTime: l.estimatedTime || 0,
          })),
        })),
      })),
    })),
  };
}

module.exports = {
  create,
  list,
  revoke,
  lookupPublicReadme,
  lookupPublicRoadmap,
};