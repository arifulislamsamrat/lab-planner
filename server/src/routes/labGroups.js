const express = require('express');
const ctrl = require('../controllers/labGroupController');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { requirePlanningWrite } = require('../middleware/roleGuards');
const { createSchema, updateSchema, reorderSchema } = require('../validators/labGroupValidator');

const router = express.Router();
router.get('/:id', validateObjectId('id'), ctrl.getOne);
router.put('/:id', validateObjectId('id'), requirePlanningWrite, validate(updateSchema), ctrl.update);
router.delete('/:id', validateObjectId('id'), requirePlanningWrite, ctrl.remove);

const nested = express.Router({ mergeParams: true });
nested.get('/', ctrl.list);
nested.post('/', requirePlanningWrite, validate(createSchema), ctrl.create);
nested.patch('/reorder', requirePlanningWrite, validate(reorderSchema), ctrl.reorder);

module.exports = { router, nested };
