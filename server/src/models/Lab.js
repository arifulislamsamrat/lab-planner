const mongoose = require('mongoose');
const { LAB_STATUSES, LAB_REVIEW_STATUSES } = require('../utils/constants');

const reviewStageSchema = new mongoose.Schema(
  {
    stage: { type: Number, required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerName: { type: String, required: true, maxlength: 120 },
    status: { type: String, enum: LAB_REVIEW_STATUSES, default: 'OPEN', index: true },
    feedback: { type: String, default: '', maxlength: 4000 },
    openedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
  },
  { _id: true, timestamps: false }
);

const labSchema = new mongoose.Schema(
  {
    labGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabGroup', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 4000 },
    instructions: { type: String, default: '', maxlength: 8000 },
    estimatedTime: { type: Number, default: 0, min: 0 }, // minutes
    order: { type: Number, required: true, default: 0, index: true },
    status: { type: String, enum: LAB_STATUSES, default: 'BACKLOG', index: true },
    mdLink: { type: String, default: '', maxlength: 1000 },
    mdContent: { type: String, default: '', maxlength: 200_000 }, // up to ~200KB of markdown
    sourceLink: { type: String, default: '', maxlength: 1000 },
    // === Lab submission & review workflow ===
    assignedMinionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedAt: { type: Date, default: null },
    // When the assigned minion acknowledged the assignment. Null until they accept.
    acceptedByMinionAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    // When a reviewer marked the lab DONE after review.
    acceptedAt: { type: Date, default: null },
    review: { type: [reviewStageSchema], default: [] },
    comments: {
      type: [
        new mongoose.Schema(
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            userName: { type: String, required: true, maxlength: 120 },
            body: { type: String, required: true, maxlength: 2000 },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true, timestamps: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lab', labSchema);
