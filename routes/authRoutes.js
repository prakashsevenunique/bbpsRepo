const express = require("express");

const { sendOtpController, verifyOTPController, registerUser, loginController, getUserController, updateProfileController, getRetailersByDistributor} = require("../controllers/authController");
const router = express.Router();

router.post("/send-otp", sendOtpController);
router.post("/verify-otp",verifyOTPController);
router.post("/login", loginController);
router.post("/register", registerUser);
router.get("/view/:id", getUserController);
router.put("/update-profile", updateProfileController); 
router.get('/distributor/:id/retailers', getRetailersByDistributor);


module.exports = router;