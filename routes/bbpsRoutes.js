const express = require('express');
const router = express.Router();


const bbpsController = require('../controllers/reportsController.js');
const authenticateToken = require('../middleware/verifyToken.js');

router.get('/report',authenticateToken, bbpsController.getBbpsReport);
router.get('/dmtReport', authenticateToken, bbpsController.getAllDmtReports);

module.exports = router;