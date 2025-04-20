const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.sendStatus(401);
  const token = header.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.sendStatus(401);
  }
}

module.exports = authMiddleware; 