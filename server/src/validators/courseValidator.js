const { z } = require('zod');
const { COURSE_STATUSES } = require('../utils/constants');

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  thumbnail: z.string().max(500).optional().default(''),
  status: z.enum(COURSE_STATUSES).optional().default('DRAFT'),
});

const updateSchema = createSchema.partial();

module.exports = { createSchema, updateSchema };