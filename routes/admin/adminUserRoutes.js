const express = require("express");
const router = express.Router();
const MainWallet = require("../../controllers/admin/mainwallet");
const plan = require("../../controllers/admin/AssignService");
const paymentRequest = require("../../controllers/admin/paymentRequestController");

const { assignPlan } = require('../../controllers/admin/assignPlantoUser');
const { getReport } = require('../../controllers/admin/servicePlanReportController');

router.get("/alluser", plan.getAlluserController);
router.get("/export-users", plan.exportUsersToExcel);
router.get("/alluserwallet", MainWallet.allUserWalletreport);
router.get("/userwallet/:userId", MainWallet.userWalletreport);
router.post("/payment-request", paymentRequest.addPaymentRequest);

// ✅ Assign Plan to User
router.post('/assign-plan', assignPlan);

// ✅ Get Report for Admin
router.get('/assign-plan/report', getReport);

module.exports = router;
