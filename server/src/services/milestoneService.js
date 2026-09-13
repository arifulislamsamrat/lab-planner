const Milestone = require('../models/Milestone');
const Module = require('../models/Module');
const LabGroup = require('../models/LabGroup');
const Lab = require('../models/Lab');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

async function ensureCourseExists(courseId) {
  const exists = await Course.exists({ _id: courseId });
  if (!exists) throw new ApiError(404, 'Course not found');
}

async function nextOrder(parentQuery) {
  const last = await Milestone.findOne(parentQuery).sort({ order: -1 }).select('order').lean();
  return last ? last.order + 1 : 0;
}

async function listByCourse(courseId) {
  await ensureCourseExists(courseId);
  return Milestone.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean();
}

async function getById(id) {
  const m = await Milestone.findById(id).lean();
  if (!m) throw new ApiError(404, 'Milestone not found');
  return m;
}

async function create(courseId, data) {
  await ensureCourseExists(courseId);
  const order = data.order ?? (await nextOrder({ courseId }));
  return Milestone.create({ ...data, courseId, order });
}

async function update(id, data) {
  const m = await Milestone.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!m) throw new ApiError(404, 'Milestone not found');
  return m;
}

async function remove(id) {
  const m = await Milestone.findById(id);
  if (!m) throw new ApiError(404, 'Milestone not found');

  const modules = await Module.find({ milestoneId: id }).select('_id').lean();
  const moduleIds = modules.map((x) => x._id);
  const labGroups = moduleIds.length ? await LabGroup.find({ moduleId: { $in: moduleIds } }).select('_id').lean() : [];
  const labGroupIds = labGroups.map((x) => x._id);
  const labCount = labGroupIds.length ? await Lab.countDocuments({ labGroupId: { $in: labGroupIds } }) : 0;

  if (modules.length > 0) {
    throw new ApiError(409, 'Milestone contains modules', {
      modules: modules.length,
      labGroups: labGroups.length,
      labs: labCount,
    });
  }
  await Milestone.deleteOne({ _id: id });
  return { ok: true };
}

async function reorder(courseId, items) {
  await ensureCourseExists(courseId);
  const ids = items.map((i) => i.id);
  const docs = await Milestone.find({ _id: { $in: ids }, courseId }).select('_id').lean();
  if (docs.length !== ids.length) throw new ApiError(400, 'Some milestones do not belong to this course');
  await Promise.all(items.map((i) => Milestone.updateOne({ _id: i.id, courseId }, { $set: { order: i.order } })));
  return { ok: true };
}

module.exports = { listByCourse, getById, create, update, remove, reorder };