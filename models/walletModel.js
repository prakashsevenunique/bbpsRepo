const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    mainWallet: {
      balance: { type: Number, default: 0 },
    },
    eWallet: {
      balance: { type: Number, default: 0 },
    },
    meta: {
      type: Map,
      of: String,
      default: {},
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
