const express = require("express");

const { aadhaarVerify, submitAadharOTP,verifyBank,verifyPAN, userVerify, updateBankAccount } = require("../controllers/kycController");
const authenticateToken = require("../middleware/verifyToken");
const router = express.Router();

router.post('/aadhar-verify',aadhaarVerify);
router.post('/submit-aadhar-otp',submitAadharOTP);
router.post("/verifybank", verifyBank);
router.post("/verifyPAN",verifyPAN);
router.post("/verifyUser", userVerify);
router.post("/bank/update",authenticateToken,updateBankAccount)

module.exports = router;