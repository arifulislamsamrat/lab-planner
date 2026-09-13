const LabGroup = require('../models/LabGroup');
const Module = require('../models/Module');
const Lab = require('../models/Lab');
const ApiError = require('../utils/ApiError');

async function ensureModuleExists(moduleId) {
  const exists = await Module.exists({ _id: moduleId });
  if (!exists) throw new ApiError(404, 'Module not found');
}

async function nextOrder(parentQuery) {
  const last = await LabGroup.findOne(parentQuery).sort({ order: -1 }).select('order').lean();
  return last ? last.order + 1 : 0;
}

async function listByModule(moduleId) {
  await ensureModuleExists(moduleId);
  return LabGroup.find({ moduleId }).sort({ order: 1, createdAt: 1 }).lean();
}

async function getById(id) {
  const g = await LabGroup.findById(id).lean();
  if (!g) throw new ApiError(404, 'Lab group not found');
  return g;
}

async function create(moduleId, data) {
  await ensureModuleExists(moduleId);
  const order = data.order ?? (await nextOrder({ moduleId }));
  return LabGroup.create({ ...data, moduleId, order });
}

async function update(id, data) {
  const g = await LabGroup.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!g) throw new ApiError(404, 'Lab group not found');
  return g;
}

async function remove(id) {
  const g = await LabGroup.findById(id);
  if (!g) throw new ApiError(404, 'Lab group not found');
  const labCount = await Lab.countDocuments({ labGroupId: id });
  if (labCount > 0) {
    throw new ApiError(409, 'Lab group contains labs', { labs: labCount });
  }
  await LabGroup.deleteOne({ _id: id });
  return { ok: true };
}

async function reorder(moduleId, items) {
  await ensureModuleExists(moduleId);
  const ids = items.map((i) => i.id);
  const docs = await LabGroup.find({ _id: { $in: ids }, moduleId }).select('_id').lean();
  if (docs.length !== ids.length) throw new ApiError(400, 'Some lab groups do not belong to this module');
  await Promise.all(items.map((i) => LabGroup.updateOne({ _id: i.id, moduleId }, { $set: { order: i.order } })));
  return { ok: true };
}

module.exports = { listByModule, getById, create, update, remove, reorder };