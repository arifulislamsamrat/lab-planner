const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/roleController');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', ctrl.list);

module.exports = router;
