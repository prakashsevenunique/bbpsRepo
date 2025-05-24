const express = require("express");
const router = express.Router();
const {  userRequest, adminAction } = require("../controllers/userRequest");

router.post("/user", userRequest);
router.post("/admin-action", adminAction);

module.exports = router;