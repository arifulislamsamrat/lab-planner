const Module = require('../models/Module');
const Milestone = require('../models/Milestone');
const LabGroup = require('../models/LabGroup');
const Lab = require('../models/Lab');
const ApiError = require('../utils/ApiError');

async function ensureMilestoneExists(milestoneId) {
  const exists = await Milestone.exists({ _id: milestoneId });
  if (!exists) throw new ApiError(404, 'Milestone not found');
}

async function nextOrder(parentQuery) {
  const last = await Module.findOne(parentQuery).sort({ order: -1 }).select('order').lean();
  return last ? last.order + 1 : 0;
}

async function listByMilestone(milestoneId) {
  await ensureMilestoneExists(milestoneId);
  return Module.find({ milestoneId }).sort({ order: 1, createdAt: 1 }).lean();
}

async function getById(id) {
  const m = await Module.findById(id).lean();
  if (!m) throw new ApiError(404, 'Module not found');
  return m;
}

async function create(milestoneId, data) {
  await ensureMilestoneExists(milestoneId);
  const order = data.order ?? (await nextOrder({ milestoneId }));
  return Module.create({ ...data, milestoneId, order });
}

async function update(id, data) {
  const m = await Module.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!m) throw new ApiError(404, 'Module not found');
  return m;
}

async function remove(id) {
  const m = await Module.findById(id);
  if (!m) throw new ApiError(404, 'Module not found');
  const labGroups = await LabGroup.find({ moduleId: id }).select('_id').lean();
  const labGroupIds = labGroups.map((x) => x._id);
  const labCount = labGroupIds.length ? await Lab.countDocuments({ labGroupId: { $in: labGroupIds } }) : 0;
  if (labGroups.length > 0) {
    throw new ApiError(409, 'Module contains lab groups', {
      labGroups: labGroups.length,
      labs: labCount,
    });
  }
  await Module.deleteOne({ _id: id });
  return { ok: true };
}

async function reorder(milestoneId, items) {
  await ensureMilestoneExists(milestoneId);
  const ids = items.map((i) => i.id);
  const docs = await Module.find({ _id: { $in: ids }, milestoneId }).select('_id').lean();
  if (docs.length !== ids.length) throw new ApiError(400, 'Some modules do not belong to this milestone');
  await Promise.all(items.map((i) => Module.updateOne({ _id: i.id, milestoneId }, { $set: { order: i.order } })));
  return { ok: true };
}

module.exports = { listByMilestone, getById, create, update, remove, reorder };