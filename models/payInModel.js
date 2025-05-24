const mongoose = require("mongoose");
const { format } = require("date-fns");  // Importing date-fns

const Schema = mongoose.Schema;

const payInSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true
    },
    reference: {
      type: String,
      required: false
    },
    name: {
      type: String,
      required: true
    },
    mobile: {
      type: Number,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Failed"], 
      default: "Pending",
      required: false
    },
    utr: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      get: (val) => format(val, "MMM dd, yyyy h:mma")  // Applying custom format to the createdAt field
    },
    transferMode: {
      type: String,
      required: false
    },
    adminAction: {
      type: String,
      required: false
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
    toJSON: { getters: true },  // Ensuring that getters are applied when converting to JSON
    toObject: { getters: true }  // Ensuring that getters are applied when converting to Object
  }
);

module.exports = mongoose.model("PayIn", payInSchema);
