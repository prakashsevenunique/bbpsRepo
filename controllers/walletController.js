const Wallet = require("../models/walletModel");
const Merchant = require("../models/merchantModel"); // Import Merchant model

// Add money to the user's wallet and update the merchant's account
const addMoneyToWallet = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid user ID or amount" });
    }

    // Find the user's wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      // Create wallet if not exists
      wallet = new Wallet({ userId, balance: 0 });
    }

    // Add money to the user's wallet
    wallet.balance += amount;
    await wallet.save();

    // Find the merchant's account (assuming a single merchant for simplicity)
    const merchant = await Merchant.findOne();
    if (!merchant) {
      return res.status(500).json({ message: "Merchant account not found" });
    }

    // Transfer the money to the merchant's account
    merchant.accountBalance += amount;
    await merchant.save();

    return res.status(200).json({
      message: "Money added to wallet and transferred to merchant successfully",
      walletBalance: wallet.balance,
      merchantBalance: merchant.accountBalance,
    });
  } catch (error) {
    console.error("Error in addMoneyToWallet:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Transfer money from user's wallet to merchant
const transferMoneyToMerchant = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid user ID or amount" });
    }

    // Find the user's wallet
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Check if the user has sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Deduct the amount from the user's wallet
    wallet.balance -= amount;
    await wallet.save();

    // Find the merchant's account
    const merchant = await Merchant.findOne();
    if (!merchant) {
      return res.status(500).json({ message: "Merchant account not found" });
    }

    // Add the money to the merchant's account
    merchant.accountBalance += amount;
    await merchant.save();

    return res.status(200).json({
      message: "Money transferred to merchant successfully",
      userWalletBalance: wallet.balance,
      merchantAccountBalance: merchant.accountBalance,
    });
  } catch (error) {
    console.error("Error in transferMoneyToMerchant:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addMoneyToWallet, transferMoneyToMerchant };
