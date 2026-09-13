const express = require('express');
const ctrl = require('../controllers/courseController');
const validate = require('../middleware/validate');
const { requirePlanningWrite, requireCourseDelete } = require('../middleware/roleGuards');
const { createSchema, updateSchema } = require('../validators/courseValidator');

const router = express.Router();

router.get('/', ctrl.list);
router.post('/', requirePlanningWrite, validate(createSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', requirePlanningWrite, validate(updateSchema), ctrl.update);
router.delete('/:id', requireCourseDelete, ctrl.remove);

module.exports = router;
