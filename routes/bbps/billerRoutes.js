const express = require("express");
const { billerInfo,billFetch,billpayment,transactionstatus,complaintregistration,complainttracking,billvalidation,plan} = require("../../controllers/bbps/billerController");
const router = express.Router();

const multer = require("multer");
const { processBillerData, getBillerByCategory, getBillerById } = require("../../controllers/bbps/billInfoXl");
const { getOperatorList, doRecharge, getBillOperatorList, payBill, fetchBillDetails, checkBillPaymentStatus, fetchLICBillDetails, payLICBill, checkLICBillPaymentStatus, checkRechargeStatus } = require("../../controllers/bbps/paySprint_BBps/Bbps");



// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => cb(null, "biller_data.xlsx"),
});

const upload = multer({ storage });

router.post("/biller-info", express.text(), billerInfo);
router.post("/billFetch", express.json(), billFetch);
router.post("/billpayment", billpayment);
router.post("/transactionstatus", transactionstatus);
router.post("/complaintregistration", complaintregistration);
router.post("/complainttracking", complainttracking);
router.post("/billvalidation", billvalidation);
router.post("/plan", plan);
// Upload and process biller data
router.post("/upload", upload.single("file"), processBillerData);

// getall billername by category
router.get("/:category",  getBillerByCategory);
// getall billername by category
router.get("/billerdata/:billerId",  getBillerById);


// paysprint bbps service 
router.get("/sprint/operator",getOperatorList)
router.post("/sprint/do-recharge",doRecharge)
router.post("/sprint/status-enquiry",checkRechargeStatus)

// paysprint bbps bill 
router.post("/get-bill-operator-list", getBillOperatorList);
router.post("/sprint/fetchbill", fetchBillDetails);
router.post("/sprint/paybill", payBill);
router.post("/sprint/bill-status", checkBillPaymentStatus);

// paysprint bbps lic 
router.post("/sprint/lic-bill",   fetchLICBillDetails);
router.post("/sprint/lic-pay",   payLICBill);
router.post("/sprint/lic-status",   checkLICBillPaymentStatus);


module.exports = router; 
