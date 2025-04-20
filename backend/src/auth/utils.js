const jwt = require('jsonwebtoken');

function createAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role_id },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );
}

function parseExpiresIn(expr) {
  const num = parseInt(expr);
  if (expr.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  if (expr.endsWith('h')) return num * 60 * 60 * 1000;
  if (expr.endsWith('m')) return num * 60 * 1000;
  if (expr.endsWith('s')) return num * 1000;
  return num;
}

module.exports = { createAccessToken, createRefreshToken, parseExpiresIn }; 