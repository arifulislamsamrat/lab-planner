const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');

function publicUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function bootstrap({ email, password, name }) {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    throw new ApiError(410, 'Bootstrap is no longer available — first account already exists.');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, name, role: 'ADMIN', passwordHash });
  const token = signToken({ id: String(user._id), role: user.role, email: user.email });
  return { token, user: publicUser(user) };
}

async function login({ email, password }) {
  const user = await User.findByEmail(email);
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(401, 'Account is disabled');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid email or password');
  const token = signToken({ id: String(user._id), role: user.role, email: user.email });
  return { token, user: publicUser(user) };
}

async function me(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return publicUser(user);
}

async function status() {
  const userCount = await User.countDocuments();
  return { bootstrapped: userCount > 0 };
}

module.exports = { bootstrap, login, me, status, publicUser };
