const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { publicUser } = require('./authService');

async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return users.map((u) => publicUser({ ...u, _id: u._id || u.id }));
}

async function createUser({ email, password, name, role, isActive }) {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'A user with that email already exists.');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, name, role, isActive, passwordHash });
  return publicUser(user);
}

async function updateUser(id, patch) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (patch.email && patch.email !== user.email) {
    const dupe = await User.findOne({ email: patch.email });
    if (dupe && String(dupe._id) !== String(user._id)) {
      throw new ApiError(409, 'A user with that email already exists.');
    }
    user.email = patch.email;
  }
  if (patch.name !== undefined) user.name = patch.name;
  if (patch.role !== undefined) user.role = patch.role;
  if (patch.isActive !== undefined) user.isActive = patch.isActive;
  if (patch.password) user.passwordHash = await bcrypt.hash(patch.password, 10);

  await user.save();
  return publicUser(user);
}

async function deleteUser(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  // Soft delete — flip isActive so existing JWTs are rejected by requireAuth.
  user.isActive = false;
  await user.save();
  return publicUser(user);
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
