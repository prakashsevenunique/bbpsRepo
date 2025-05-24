const express = require("express");

const {operatorLogo} = require('../controllers/opLogoController');

const router = express.Router();

router.get("/logo", operatorLogo);


module.exports = router;
