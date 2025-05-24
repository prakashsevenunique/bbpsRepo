const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    accountBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Merchant", merchantSchema);
