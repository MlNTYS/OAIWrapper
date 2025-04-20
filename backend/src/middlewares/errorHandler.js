function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate value' });
  }
  // Prisma not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Not found' });
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal Server Error' });
}

module.exports = errorHandler; 