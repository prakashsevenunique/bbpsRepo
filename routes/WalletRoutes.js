const express = require('express');
const { celebrate, Segments, Joi } = require('celebrate');
const router = express.Router();
const controller = require('../controllers/WalletControlller.js');
const authenticateToken = require('../middleware/verifyToken.js');


const validation = {
  [Segments.QUERY]: Joi.object().keys({
    userId: Joi.string().hex().length(24).optional().allow(null, ""),
    transaction_type: Joi.string().valid('credit', 'debit').optional().allow(null, ""),
    status: Joi.string().valid('completed', 'pending', 'failed').optional().allow(null, ""),
    payment_mode: Joi.string().valid('wallet', 'bank_transfer', 'cash').optional().allow(null, ""),
    fromDate: Joi.date().iso().optional().allow(null, ""),
    toDate: Joi.date().iso().optional().allow(null, ""),
    exportCsv: Joi.string().valid('true', 'false').default('false').optional().allow(null, ""),
    page: Joi.number().integer().min(1).default(1).optional().allow(null, ""),
    limit: Joi.number().integer().min(1).max(100).default(10).optional().allow(null, "")
  }).unknown(true)
};

router.get(
  '/',
  celebrate(validation), authenticateToken,
  controller.getWalletTransactions
);

router.get(
  '/main', authenticateToken,
  controller.getMainWalletTransactions
);


router.post('/', authenticateToken, controller.createWalletTransaction);

module.exports = router;