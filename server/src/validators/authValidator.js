const { z } = require('zod');

const emailField = z.string().trim().toLowerCase().email().max(200);

const passwordField = z.string().min(8).max(200);

const nameField = z.string().trim().min(1).max(120);

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(200),
});

const bootstrapSchema = z.object({
  email: emailField,
  password: passwordField,
  name: nameField,
});

module.exports = { loginSchema, bootstrapSchema };
