const { check, param } = require('express-validator');

const createModelRules = [
  check('api_name').notEmpty().withMessage('Model api_name is required'),
  check('api_name').isString().withMessage('api_name must be a string'),
  check('name').notEmpty().withMessage('Model name is required'),
  check('cost').isInt({ min: 0 }).withMessage('Cost must be a non-negative integer'),
  check('is_enabled').optional().isBoolean().withMessage('is_enabled must be boolean'),
];

const updateModelRules = [
  check('api_name').optional().notEmpty().withMessage('Model api_name cannot be empty'),
  check('api_name').optional().isString().withMessage('api_name must be a string'),
  check('name').optional().notEmpty().withMessage('Model name cannot be empty'),
  check('cost').optional().isInt({ min: 0 }).withMessage('Cost must be a non-negative integer'),
  check('is_enabled').optional().isBoolean().withMessage('is_enabled must be boolean'),
];

const idParamRule = [
  param('id').isUUID().withMessage('Model id parameter must be UUID'),
];

module.exports = { createModelRules, updateModelRules, idParamRule }; 