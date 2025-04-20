const adminOnly = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.sendStatus(403);
  }
  next();
};

const ownerOrAdmin = (req, res, next) => {
  if (req.userRole === 'ADMIN' || req.userId === req.params.id) {
    return next();
  }
  return res.sendStatus(403);
};

module.exports = { adminOnly, ownerOrAdmin }; 