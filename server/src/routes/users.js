const express = require('express');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/userController');
const { createUserSchema, updateUserSchema } = require('../validators/userValidator');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', ctrl.list);
router.post('/', validate(createUserSchema), ctrl.create);
router.patch('/:id', validateObjectId('id'), validate(updateUserSchema), ctrl.update);
router.delete('/:id', validateObjectId('id'), ctrl.remove);

module.exports = router;
