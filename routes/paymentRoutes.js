const express = require("express");

const {payIn, callbackPayIn, getPayInRes, payInReportAllUsers, payInReportForUser, payinUserCount} = require('../controllers/payIn');
const {payOut, adminAction, callbackPayout, payOutReportAllUsers, payOutReportForUser, payOutUserCount} = require("../controllers/payOut");
const {combinedReportForUser} = require("../controllers/combinedReportForUser ");
const router = express.Router();

router.post("/payIn", payIn);
router.post("/payOut", payOut);
router.post("/payout/admin-action", adminAction);
router.get("/payIn/response", getPayInRes);
router.post("/payIn/callback", callbackPayIn);
router.post("/payOut/callback", callbackPayout);
router.get("/payIn/report", payInReportAllUsers);
router.get("/payOut/report", payOutReportAllUsers);
router.get("/payIn/user/report", payInReportForUser);
router.get("/payOut/user/report", payOutReportForUser);
router.get("/user/report", combinedReportForUser);
router.get("/payIn/total-sums/:userId", payinUserCount);
router.get("/payOut/total-sums/:userId", payOutUserCount);

module.exports = router;
