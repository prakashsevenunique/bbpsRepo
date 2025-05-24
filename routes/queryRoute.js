const express = require("express");
const router = express.Router();
const { submitForm } = require("../controllers/queryController");

router.post("/submit-form", submitForm);

module.exports = router;