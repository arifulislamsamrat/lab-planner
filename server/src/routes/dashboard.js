const express = require('express');
const Course = require('../models/Course');
const Milestone = require('../models/Milestone');
const Module = require('../models/Module');
const LabGroup = require('../models/LabGroup');
const Lab = require('../models/Lab');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router({ mergeParams: true });

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [courses, milestones, modules, labGroups, labs] = await Promise.all([
      Course.countDocuments(),
      Milestone.countDocuments(),
      Module.countDocuments(),
      LabGroup.countDocuments(),
      Lab.countDocuments(),
    ]);
    const recentCourses = await Course.find().sort({ updatedAt: -1 }).limit(5).lean();
    res.json({
      data: {
        counts: { courses, milestones, modules, labGroups, labs },
        recentCourses,
      },
    });
  })
);

module.exports = { router };