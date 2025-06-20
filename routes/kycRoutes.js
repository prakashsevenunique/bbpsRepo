const express = require("express");

const { aadhaarVerify, submitAadharOTP,verifyBank,verifyPAN, userVerify, updateBankAccount } = require("../controllers/kycController");
const authenticateToken = require("../middleware/verifyToken");
const router = express.Router();

router.post('/aadhar-verify',aadhaarVerify);
router.post('/submit-aadhar-otp',authenticateToken ,submitAadharOTP);
router.post("/verifybank",authenticateToken, verifyBank);
router.post("/verifyPAN",authenticateToken, verifyPAN);
router.get("/verifyUser",authenticateToken, userVerify);
router.post("/bank/update",authenticateToken,updateBankAccount)

module.exports = router;