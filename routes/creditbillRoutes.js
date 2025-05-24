const express = require('express');
const router = express.Router();

const {validate,viewbill, initiateRecharge} = require('../controllers/creditbillController');

router.post('/validate', validate);
router.post('/viewbill', viewbill);
router.post('/recharge', initiateRecharge);

module.exports = router;