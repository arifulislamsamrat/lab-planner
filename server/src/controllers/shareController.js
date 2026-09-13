const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/shareService');

// Authenticated: create a new share.
const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.user, req.body);
  res.status(201).json({ data });
});

// Authenticated: list active shares for the current user.
const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.user, req.query);
  res.json({ data });
});

// Authenticated: revoke a share.
const remove = asyncHandler(async (req, res) => {
  const data = await service.revoke(req.user, req.params.id);
  res.json({ data });
});

// Public: lookup a readme share.
const publicReadme = asyncHandler(async (req, res) => {
  const data = await service.lookupPublicReadme(req.params.token);
  res.json({ data });
});

// Public: lookup a roadmap share.
const publicRoadmap = asyncHandler(async (req, res) => {
  const data = await service.lookupPublicRoadmap(req.params.token);
  res.json({ data });
});

module.exports = {
  create,
  list,
  remove,
  publicReadme,
  publicRoadmap,
};
