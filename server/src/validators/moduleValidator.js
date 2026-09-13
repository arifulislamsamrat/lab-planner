const { z } = require('zod');
const { ITEM_STATUSES } = require('../utils/constants');
const { objectId } = require('./milestoneValidator');

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  order: z.number().int().nonnegative().optional(),
  status: z.enum(ITEM_STATUSES).optional(),
});

const updateSchema = createSchema.partial();

const reorderSchema = z.object({
  items: z.array(z.object({ id: objectId, order: z.number().int().nonnegative() })).min(1),
});

module.exports = { createSchema, updateSchema, reorderSchema };