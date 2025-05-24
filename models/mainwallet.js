const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mainSchema = new mongoose.Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        amount: {
            type: Number,
            required: true
        },
        reference: {
            type: String,
            required: true
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
        }
    }
);

module.exports = mongoose.model("main", mainSchema);