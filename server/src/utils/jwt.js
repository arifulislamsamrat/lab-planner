const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Set it in server/.env.');
  }
  return secret;
}

function getExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '8h';
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: getExpiresIn() });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
