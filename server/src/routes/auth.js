const express = require('express');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const ctrl = require('../controllers/authController');
const { loginSchema, bootstrapSchema } = require('../validators/authValidator');

const router = express.Router();

// Cheap public status check used by the client to detect first-run.
router.get('/status', ctrl.status);

// Run BEFORE zod so a malformed second-bootstrap still tells the caller "closed".
async function requireNotBootstrapped(_req, _res, next) {
  try {
    const count = await User.countDocuments();
    if (count > 0) return next(new ApiError(410, 'Bootstrap is no longer available — first account already exists.'));
    return next();
  } catch (e) {
    return next(e);
  }
}

// First-run signup. Disabled after the first admin exists.
router.post('/bootstrap', requireNotBootstrapped, validate(bootstrapSchema), ctrl.bootstrap);

router.post('/login', loginLimiter, validate(loginSchema), ctrl.login);

router.get('/me', requireAuth, ctrl.me);

module.exports = router;
