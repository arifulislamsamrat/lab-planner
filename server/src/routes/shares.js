const express = require('express');
const ctrl = require('../controllers/shareController');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { createSchema, listQuerySchema } = require('../validators/shareValidator');

const router = express.Router();

// Authenticated — create / list / revoke. Mounted under requireAuth.
router.post('/', validate(createSchema), ctrl.create);
router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.delete('/:id', validateObjectId('id'), ctrl.remove);

module.exports = router;
