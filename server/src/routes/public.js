/**
 * Public (unauthenticated) routes for share links.
 * Mounted BEFORE requireAuth in routes/index.js.
 *
 * Path tokens are validated format-wise but not as Mongo ObjectIds — tokens are
 * 32-char base64url strings, not ObjectIds. We rely on the service to look them up.
 */

const express = require('express');
const ctrl = require('../controllers/shareController');

const router = express.Router();

// Token shape: 32 url-safe chars. Reject obvious garbage cheaply.
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

function validateToken(req, _res, next) {
  if (!TOKEN_RE.test(req.params.token)) {
    const ApiError = require('../utils/ApiError');
    return next(new ApiError(404, 'Not found'));
  }
  next();
}

router.get('/readme/:token', validateToken, ctrl.publicReadme);
router.get('/roadmap/:token', validateToken, ctrl.publicRoadmap);

module.exports = router;
