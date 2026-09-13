const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/authService');

const bootstrap = asyncHandler(async (req, res) => {
  const data = await service.bootstrap(req.body);
  res.status(201).json({ data });
});

const login = asyncHandler(async (req, res) => {
  const data = await service.login(req.body);
  res.json({ data });
});

const me = asyncHandler(async (req, res) => {
  const user = await service.me(req.user.id);
  res.json({ data: user });
});

const status = asyncHandler(async (_req, res) => {
  const data = await service.status();
  res.json({ data });
});

module.exports = { bootstrap, login, me, status };
