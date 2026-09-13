const express = require('express');
const ctrl = require('../controllers/labController');
const resourceCtrl = require('../controllers/resourceController');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const {
  requireLabWrite,
  requireLabStatus,
  requireReviewer,
  requireAssigner,
} = require('../middleware/roleGuards');
const {
  createSchema,
  updateSchema,
  statusSchema,
  reorderSchema,
  commentSchema,
  assignSchema,
  reviewOpenSchema,
} = require('../validators/labValidator');

// Flat-by-id router (mounted at /api/labs)
const router = express.Router();
// "My labs" must be before /:id to avoid being treated as an id param.
router.get('/my-labs', ctrl.myLabs);
router.get('/:id', validateObjectId('id'), ctrl.getOne);
router.put('/:id', validateObjectId('id'), requireLabWrite, validate(updateSchema), ctrl.update);
router.delete('/:id', validateObjectId('id'), requireLabWrite, ctrl.remove);
router.patch('/:id/status', validateObjectId('id'), requireLabStatus, validate(statusSchema), ctrl.updateStatus);
router.get('/:id/resource', validateObjectId('id'), resourceCtrl.getLabResource);

// Comments
router.post('/:id/comments', validateObjectId('id'), validate(commentSchema), ctrl.addComment);
router.delete('/:id/comments/:commentId', validateObjectId('id'), validateObjectId('commentId'), ctrl.removeComment);

// Assignment + submission + review workflow
router.post('/:id/assign', validateObjectId('id'), requireAssigner, validate(assignSchema), ctrl.assign);
router.delete('/:id/assign', validateObjectId('id'), requireAssigner, ctrl.unassign);
router.post('/:id/submit', validateObjectId('id'), ctrl.submit);
router.post('/:id/accept-assignment', validateObjectId('id'), ctrl.acceptAssignment);
router.post('/:id/decline-assignment', validateObjectId('id'), ctrl.declineAssignment);
router.post('/:id/review/open', validateObjectId('id'), requireReviewer, validate(reviewOpenSchema), ctrl.openReview);
router.post('/:id/review/:stageId/resolve', validateObjectId('id'), validateObjectId('stageId'), requireReviewer, ctrl.resolveReview);
router.post('/:id/review/accept', validateObjectId('id'), requireReviewer, ctrl.acceptLab);

// Cross-group reorder used by Kanban (mounted at /api/labs)
router.patch('/reorder', requireLabWrite, validate(reorderSchema), ctrl.reorderAcrossGroups);

// Nested sub-router (mounted at /api/lab-groups/:labGroupId/labs)
const nested = express.Router({ mergeParams: true });
nested.get('/', ctrl.list);
nested.post('/', requireLabWrite, validate(createSchema), ctrl.create);
nested.patch('/reorder', requireLabWrite, validate(reorderSchema), ctrl.reorder);

module.exports = { router, nested };
