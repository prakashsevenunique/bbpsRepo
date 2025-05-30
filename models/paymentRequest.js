const mongoose = require("mongoose");

const paymentRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["Credit", "Debit"],
        message: "{VALUE} is not supported. Use: Credit or Debit",
      },
      required: true,
    },
    mode: {
      type: String,
      enum: {
        values: [
          "UPI",
          "Bank Transfer",
          "NEFT",
          "RTGS",
          "IMPS",
          "Cash",
          "Wallet",
          "Cheque",
          "Card",
          "Other"
        ],
        message: "Invalid payment mode",
      },
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than zero"],
      validate: {
        validator: Number.isFinite,
        message: "{VALUE} is not a valid number",
      },
    },
    description: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Processing", "Completed", "Failed", "Cancelled", "Refunded"],
        default: "Pending",
      },
      required: true,
    },
    bankDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      bankName: { type: String, trim: true },
      branch: { type: String, trim: true },
    },
    upiDetails: {
      vpa: { type: String, trim: true, lowercase: true },
    },
    utr: {
      type: String,
      trim: true,
      default: null,
    },
    remark: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

paymentRequestSchema.index({ status: 1 });

module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);