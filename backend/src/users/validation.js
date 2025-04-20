const { check, param } = require('express-validator');

const createUserRules = [
  check('email').isEmail(),
  check('password').isLength({ min: 6 }),
  check('role_id').isIn(['USER', 'ADMIN']),
  check('is_verified').optional().isBoolean(),
];

const updateUserRules = [
  check('email').optional().isEmail(),
  check('password').optional().isLength({ min: 6 }),
  check('role_id').optional().isIn(['USER', 'ADMIN']),
  check('is_verified').optional().isBoolean(),
];

const idParamRule = [
  param('id').isUUID(),
];

module.exports = { createUserRules, updateUserRules, idParamRule }; 