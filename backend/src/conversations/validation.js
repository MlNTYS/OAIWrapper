const { param } = require('express-validator');

const idParamRule = [
  param('id').isUUID().withMessage('Conversation id must be a UUID'),
];

module.exports = { idParamRule }; 