// router.js
const express = require('express');

const { payIn } = require('../controllers/Payu');
const router = express.Router();


router.post('/payu', payIn);


module.exports = router;