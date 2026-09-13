const mongoose = require('mongoose');
const { ITEM_STATUSES } = require('../utils/constants');

const labGroupSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    order: { type: Number, required: true, default: 0, index: true },
    status: { type: String, enum: ITEM_STATUSES, default: 'PLANNED' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabGroup', labGroupSchema);