const express = require('express');
const ctrl = require('../controllers/searchController');
const validate = require('../middleware/validate');
const { searchQuerySchema } = require('../validators/searchValidator');

const router = express.Router();

// GET /api/search?q=...&limit=...
// Auth required (mounted under requireAuth in routes/index.js).
router.get('/', validate(searchQuerySchema, 'query'), ctrl.global);

module.exports = router;
