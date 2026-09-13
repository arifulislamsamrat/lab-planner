const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) throw new ApiError(401, 'Not authenticated');
    const decoded = verifyToken(match[1]);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new ApiError(401, 'Not authenticated');
    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, 'Not authenticated'));
  }
}

function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!allowed.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden'));
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
