const mongoose = require("mongoose");
const { format } = require("date-fns");

const Schema = mongoose.Schema;

const payOutSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      required: false,
    },
    trans_mode: {
      type: String,
      required: false,
    },
    account: {
      type: String,
      required: false,
    },
    ifsc: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Failed"],
      default: "Pending",
      required: false,
    },
    txn_id: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      get: (val) => format(val, "MMM dd, yyyy h:mma"),
    },
    utr: {
      type: String,
      required: false,
    },
    adminAction: {
      type: String,
      required: false,
    },
    remark: {
      type: String,
      required: false,
    },
    adminCommission: {
      type: String,
      required: false,
    },
    distributorCommission: {
      type: String,
      required: false,
    },
    charges: {
      type: String,
      required: false,
    },
    gst: {
      type: String,
      required: false,
    },
    tds: {
      type: String,
      required: false,
    },
    netAmount: {
      type: String,
      required: false
    },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

module.exports = mongoose.model("PayOut", payOutSchema);
