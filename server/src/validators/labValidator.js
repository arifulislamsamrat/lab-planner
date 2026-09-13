const { z } = require('zod');
const { LAB_STATUSES } = require('../utils/constants');
const { objectId } = require('./milestoneValidator');

// Accepts a valid URL string, the empty string, or undefined (which defaults to '').
// When the field is absent, .optional() lets it through; .default('') normalizes it.
const httpUrl = z.union([
  z.string().url().max(1000),
  z.literal(''),
]).optional().default('').transform((v) => (v == null ? '' : v));

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).optional().default(''),
  instructions: z.string().max(8000).optional().default(''),
  estimatedTime: z.number().int().nonnegative().optional().default(0),
  order: z.number().int().nonnegative().optional(),
  status: z.enum(LAB_STATUSES).optional(),
  mdLink: httpUrl,
  mdContent: z.string().max(200_000).optional().default(''),
  sourceLink: httpUrl,
});

const updateSchema = createSchema.partial();

const statusSchema = z.object({
  status: z.enum(LAB_STATUSES),
});

const reorderSchema = z.object({
  items: z.array(z.object({ id: objectId, order: z.number().int().nonnegative() })).min(1),
});

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

const assignSchema = z.object({
  minionId: objectId,
});

const reviewOpenSchema = z.object({
  feedback: z.string().trim().min(1).max(4000),
});

module.exports = {
  createSchema,
  updateSchema,
  statusSchema,
  reorderSchema,
  commentSchema,
  assignSchema,
  reviewOpenSchema,
};