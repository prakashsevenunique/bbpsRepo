const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/verifyToken.js');
const authorizeRoles = require('../middleware/verifyRole.js');
const { Joi, Segments, celebrate } = require('celebrate');
const { getOperatorList, doRecharge, hlrCheck, browsePlan, checkRechargeStatus } = require('../controllers/SprintVerify/rechargeController.js');

router.post('/recharge/hlrcheck', authenticateToken, celebrate({
    [Segments.BODY]: Joi.object().keys({
        number: Joi.number().required(),
        type: Joi.string().required()
    })
}), hlrCheck);
router.get('/recharge/browseplan', authenticateToken, celebrate({
    [Segments.QUERY]: Joi.object().keys({
        circle: Joi.string().required(),
        op: Joi.string().required()
    })
}), browsePlan);

router.get('/recharge/opertor', authenticateToken, getOperatorList);

router.post('/recharge/dorecharge', authenticateToken, celebrate({
    [Segments.BODY]: Joi.object().keys({
        operator: Joi.string().required(),
        canumber: Joi.string().required(),
        amount: Joi.number().required(),
        category: Joi.string().required()
    })
}), doRecharge);

router.get("/recharge/status/:transactionId", authenticateToken, celebrate({
    [Segments.PARAMS]: Joi.object().keys({
        transactionId: Joi.string().required()
    })
}),checkRechargeStatus)




module.exports = router;