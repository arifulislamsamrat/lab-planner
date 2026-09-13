const express = require('express');
const milestoneCtrl = require('../controllers/milestoneController');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { requirePlanningWrite } = require('../middleware/roleGuards');
const { createSchema, updateSchema, reorderSchema } = require('../validators/milestoneValidator');

// Flat by id
const router = express.Router();
router.get('/:id', validateObjectId('id'), milestoneCtrl.getOne);
router.put('/:id', validateObjectId('id'), requirePlanningWrite, validate(updateSchema), milestoneCtrl.update);
router.delete('/:id', validateObjectId('id'), requirePlanningWrite, milestoneCtrl.remove);

// Nested sub-router to be mounted on /courses/:courseId/milestones
const nested = express.Router({ mergeParams: true });
nested.get('/', milestoneCtrl.list);
nested.post('/', requirePlanningWrite, validate(createSchema), milestoneCtrl.create);
nested.patch('/reorder', requirePlanningWrite, validate(reorderSchema), milestoneCtrl.reorder);

module.exports = { router, nested };
