const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/verifyToken.js');
const { queryRemitter, remitterEkyc, registerRemitter, registerBeneficiary, fetchBeneficiary, BeneficiaryById, deleteBeneficiary, PennyDrop, sendTransactionOtp, performTransaction, TrackTransaction, RefundOtp, Refund } = require('../controllers/SprintVerify/dmtController.js');

router.post('/d1/query', authenticateToken, queryRemitter);
router.post('/d1/kyc',authenticateToken, remitterEkyc);
router.post('/d1/register',authenticateToken,registerRemitter);
router.post('/d1/bene/register',authenticateToken,registerBeneficiary);
router.get("/d1/bene",authenticateToken,fetchBeneficiary);
router.delete("/d1/bene",authenticateToken,deleteBeneficiary);
router.get("/d1/bene_id",authenticateToken,BeneficiaryById);

router.post('/d1/pennydrop',authenticateToken, PennyDrop);
router.post('/d1/send-otp',authenticateToken,sendTransactionOtp);
router.post('/d1/perform-transaction',authenticateToken,performTransaction);
router.post('/d1/track-transaction',authenticateToken, TrackTransaction);
router.post('/d1/refund-otp',authenticateToken, RefundOtp);
router.post('/d1/refund',authenticateToken, Refund);


module.exports = router;
