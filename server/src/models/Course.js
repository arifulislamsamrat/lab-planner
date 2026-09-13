const mongoose = require('mongoose');
const { COURSE_STATUSES } = require('../utils/constants');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    thumbnail: { type: String, default: '' },
    status: { type: String, enum: COURSE_STATUSES, default: 'DRAFT' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);