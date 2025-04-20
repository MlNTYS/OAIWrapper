const prisma = require('../prisma');
const argon2 = require('argon2');

async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role_id: true, is_verified: true, current_credit: true, created_at: true }
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, role_id: true, is_verified: true, current_credit: true, created_at: true }
    });
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { email, password, role_id, is_verified } = req.body;
    const password_hash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: { email, password_hash, role_id, is_verified },
      select: { id: true, email: true, role_id: true, is_verified: true, current_credit: true, created_at: true }
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { email, password, role_id, is_verified, current_credit } = req.body;
    const data = {};
    if (email) data.email = email;
    if (password) data.password_hash = await argon2.hash(password);
    if (role_id) data.role_id = role_id;
    if (typeof is_verified !== 'undefined') data.is_verified = is_verified;
    if (typeof current_credit !== 'undefined') data.current_credit = current_credit;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, role_id: true, is_verified: true, current_credit: true, created_at: true }
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser }; 