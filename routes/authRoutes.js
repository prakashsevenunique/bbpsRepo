const express = require('express');
const router = express.Router();
const {
  sendOtpController,
  verifyOTPController,
  registerUser,
  loginController,
  updateProfileController,
  getUserController,
  getUsersWithFilters,
  updateUserStatus,
  updateUserDetails,
  getDashboardSummary
} = require('../controllers/authController.js');
const authenticateToken = require('../middleware/verifyToken.js');
const authorizeRoles = require('../middleware/verifyRole.js');

router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOTPController);
router.post('/register', registerUser);
router.post('/login', loginController);
router.put('/profile',authenticateToken, updateProfileController);
router.get('/profile',authenticateToken, getUserController);
router.get('/users',authenticateToken,authorizeRoles("Admin","Distributor"), getUsersWithFilters);
router.put('/user/:id/status',authenticateToken,authorizeRoles("Admin"), updateUserStatus);
router.put('/user/:id',authenticateToken,authorizeRoles("Admin"), updateUserDetails);
router.get('/dashboard',authenticateToken,authorizeRoles("Admin","Distributor","Retailer"), getDashboardSummary);

module.exports = router;
