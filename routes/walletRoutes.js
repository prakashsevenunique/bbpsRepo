const express = require("express");
const { addMoneyToWallet, transferMoneyToMerchant } = require("../controllers/walletController");

const router = express.Router();

// Route to add money to the wallet and merchant
router.post("/add-money", addMoneyToWallet);

// Route to transfer money to the merchant
router.post("/transfer-money", transferMoneyToMerchant);

module.exports = router;
