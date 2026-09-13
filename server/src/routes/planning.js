const express = require('express');
const { getPlanning } = require('../controllers/planningController');

const router = express.Router({ mergeParams: true });
router.get('/', getPlanning);
module.exports = router;