// router.js
const express = require('express');
const { getPlans } = require('../controllers/planController');
const {getPlanTypes} = require('../controllers/planController')
const router = express.Router();


router.post('/plansAPI', getPlans);
router.post('/plansTypeAPI', getPlanTypes);

module.exports = router;
