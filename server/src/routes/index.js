const express = require('express');
const validateObjectId = require('../middleware/validateObjectId');

const authRouter = require('./auth');
const usersRouter = require('./users');
const rolesRouter = require('./roles');
const coursesRouter = require('./courses');
const milestonesMod = require('./milestones');
const modulesMod = require('./modules');
const labGroupsMod = require('./labGroups');
const labsMod = require('./labs');
const dashboardMod = require('./dashboard');
const planningRouter = require('./planning');
const searchRouter = require('./search');
const sharesRouter = require('./shares');
const publicRouter = require('./public');

const router = express.Router();

// Auth — public (mounted before requireAuth in app.js).
router.use('/auth', authRouter);

// Public share links — mounted BEFORE requireAuth (no auth required to view).
router.use('/public', publicRouter);

// Everything below requires authentication.
router.use(require('../middleware/auth').requireAuth);

router.use('/users', usersRouter);
router.use('/roles', rolesRouter);

// Flat by id
router.use('/courses', coursesRouter);
router.use('/milestones', milestonesMod.router);
router.use('/modules', modulesMod.router);
router.use('/lab-groups', labGroupsMod.router);
router.use('/labs', labsMod.router);
router.use('/dashboard', dashboardMod.router);
router.use('/search', searchRouter);
router.use('/shares', sharesRouter);

// Nested routes (mounted under their parents)
router.use('/courses/:courseId/milestones', validateObjectId('courseId'), milestonesMod.nested);
router.use('/courses/:courseId/planning', validateObjectId('courseId'), planningRouter);
router.use('/milestones/:milestoneId/modules', validateObjectId('milestoneId'), modulesMod.nested);
router.use('/modules/:moduleId/lab-groups', validateObjectId('moduleId'), labGroupsMod.nested);
router.use('/lab-groups/:labGroupId/labs', validateObjectId('labGroupId'), labsMod.nested);

module.exports = router;
