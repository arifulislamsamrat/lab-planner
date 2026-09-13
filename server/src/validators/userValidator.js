const { z } = require('zod');
const { ROLES } = require('../utils/constants');

const emailField = z.string().trim().toLowerCase().email().max(200);

const createUserSchema = z.object({
  email: emailField,
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(120),
  role: z.enum(ROLES),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  email: emailField.optional(),
  password: z.string().min(8).max(200).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

module.exports = { createUserSchema, updateUserSchema };
