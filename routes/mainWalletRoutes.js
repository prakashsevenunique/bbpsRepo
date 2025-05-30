const express = require('express');
const { celebrate, Segments, Joi } = require('celebrate');
const authenticateToken = require('../middleware/verifyToken.js');
const { allPayin, generatePayment, callbackPayIn, checkPayInStatus } = require('../controllers/payInController.js');
const { getPayOuts, generatePayOut, callbackPayout, getPayoutStatus } = require('../controllers/payoutController.js');
const router = express.Router();

const validation = {
    [Segments.QUERY]: Joi.object().keys({
        userId: Joi.string().hex().length(24),
        status: Joi.string().valid('completed', 'pending', 'failed'),
        fromDate: Joi.date().iso(),
        toDate: Joi.date().iso(),
        exportCsv: Joi.string().valid('true', 'false').default('false'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }).unknown(true)
};

router.get('/payin', celebrate(validation), authenticateToken, allPayin);
router.post('/payin', authenticateToken, generatePayment);
router.post('/payin/callback', callbackPayIn);
router.get('/payin/:reference', authenticateToken, checkPayInStatus);

router.get('/payout', celebrate(validation), authenticateToken, getPayOuts);
router.post('/payout', authenticateToken, generatePayOut);
router.post('/payout/callback',callbackPayout);
router.get('/payout/:reference', authenticateToken, getPayoutStatus);

module.exports = router;