const express = require('express');
const moduleCtrl = require('../controllers/moduleController');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { requirePlanningWrite } = require('../middleware/roleGuards');
const { createSchema, updateSchema, reorderSchema } = require('../validators/moduleValidator');

const router = express.Router();
router.get('/:id', validateObjectId('id'), moduleCtrl.getOne);
router.put('/:id', validateObjectId('id'), requirePlanningWrite, validate(updateSchema), moduleCtrl.update);
router.delete('/:id', validateObjectId('id'), requirePlanningWrite, moduleCtrl.remove);

const nested = express.Router({ mergeParams: true });
nested.get('/', moduleCtrl.list);
nested.post('/', requirePlanningWrite, validate(createSchema), moduleCtrl.create);
nested.patch('/reorder', requirePlanningWrite, validate(reorderSchema), moduleCtrl.reorder);

module.exports = { router, nested };
