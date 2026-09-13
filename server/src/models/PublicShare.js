const mongoose = require('mongoose');

/**
 * Public share links.
 *
 * Two kinds:
 *   - LAB_README      — public read-only view of a lab's readme (mdContent / mdLink).
 *                       Anyone authenticated can create this (incl. MINION), but the
 *                       button label differs per role ("Share lab view" for
 *                       instructors/coordinators, "Share readme" for minions).
 *   - COURSE_ROADMAP  — public read-only view of a course's full planning tree.
 *                       Only ADMIN / COURSE_COORDINATOR / INSTRUCTOR can create.
 *
 * Public lookup checks `kind` against the requested endpoint, so a token of one
 * kind cannot be used to fetch another (returns 404 — no existence leak).
 */
const PUBLIC_SHARE_KINDS = ['LAB_README', 'COURSE_ROADMAP'];

const publicShareSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: PUBLIC_SHARE_KINDS, required: true, index: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PublicShare', publicShareSchema);
module.exports.PUBLIC_SHARE_KINDS = PUBLIC_SHARE_KINDS;
