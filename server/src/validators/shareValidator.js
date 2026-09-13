const { z } = require('zod');
const { objectId } = require('./milestoneValidator');
const { PUBLIC_SHARE_KINDS } = require('../models/PublicShare');

const createSchema = z.object({
  kind: z.enum(PUBLIC_SHARE_KINDS),
  refId: objectId,
});

const listQuerySchema = z.object({
  kind: z.enum(PUBLIC_SHARE_KINDS).optional(),
  refId: objectId.optional(),
});

module.exports = { createSchema, listQuerySchema };
