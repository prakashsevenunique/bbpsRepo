const express = require("express");

const { queryRemitter, registerBeneficiary, remitterEKyc, deleteBeneficiary, fetchBeneficiary, BeneficiaryById, PennyDrop, sendTransactionOtp, performTransaction, TrackTransaction, RefundOtp, Refund } = require("../../controllers/Dmt&Aeps/DmtController");



const router = express.Router();

router.post("/queryRemitter", queryRemitter);
router.post("/queryRemitter/kyc", remitterEKyc);
router.post("/registerBeneficiary", registerBeneficiary);
router.post("/deleteBeneficiary", deleteBeneficiary);
router.post("/fetchBeneficiary", fetchBeneficiary);
router.post("/BeneficiaryById", BeneficiaryById);

// transaction
router.post("/PennyDrop", PennyDrop);
router.post("/sendTransactionOtp", sendTransactionOtp);
router.post("/performTransaction", performTransaction);
router.post("/TrackTransaction", TrackTransaction);

// refund 
router.post("/RefundOtp", RefundOtp);
router.post("/Refund", Refund);





module.exports = router;