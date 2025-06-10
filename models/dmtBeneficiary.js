const mongoose = require("mongoose");

const BeneficiarySchema = new mongoose.Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mobile: {
        type: String,
        required: true
    },
    benename: {
        type: String,
        required: true
    },
    bankid: {
        type: String,
        required: true
    },
    accno: {
        type: String,
        required: true
    },
    ifsccode: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    gst_state: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Beneficiary", BeneficiarySchema);
