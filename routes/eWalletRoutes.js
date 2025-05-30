const express = require('express');
const { celebrate, Segments, Joi } = require('celebrate');
const router = express.Router();
const controller = require('../controllers/eWalletControlller.js');
const authenticateToken = require('../middleware/verifyToken.js');


const validation = {
  [Segments.QUERY]: Joi.object().keys({
    userId: Joi.string().hex().length(24),
    transaction_type: Joi.string().valid('credit', 'debit'),
    status: Joi.string().valid('completed', 'pending', 'failed'),
    payment_mode: Joi.string().valid('wallet', 'bank_transfer', 'cash'),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    exportCsv: Joi.string().valid('true', 'false').default('false'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }).unknown(true)
};
  
router.get(
  '/',
  celebrate(validation),authenticateToken,
  controller.getWalletTransactions
);
router.post('/',authenticateToken, controller.createWalletTransaction);

module.exports = router;