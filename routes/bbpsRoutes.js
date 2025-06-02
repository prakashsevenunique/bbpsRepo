const express = require('express');
const router = express.Router();


const bbpsController = require('../controllers/bbpsController.js');

router.get('/report', bbpsController.getBbpsReport);

router.post('/history',bbpsController.saveRecharge);

module.exports = router;