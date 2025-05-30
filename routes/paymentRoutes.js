const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { celebrate } = require("celebrate");

const createPaymentRequestSchema = celebrate({
    body: Joi.object({
        reference: Joi.string().required().trim(),
        type: Joi.string().valid("Credit", "Debit").required(),
        mode: Joi.string()
            .valid(
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
            )
            .required(),
        amount: Joi.number().positive().min(0.01).required(),
        description: Joi.string().optional().allow("").trim(),
        status: Joi.string()
            .valid("Pending", "Processing", "Completed", "Failed", "Cancelled", "Refunded")
            .default("Pending"),
        bankDetails: Joi.object({
            accountName: Joi.string().optional().trim(),
            accountNumber: Joi.string().optional().trim(),
            ifscCode: Joi.string().optional().uppercase().trim(),
            bankName: Joi.string().optional().trim(),
            branch: Joi.string().optional().trim(),
        }).optional(),
        upiDetails: Joi.object({
            vpa: Joi.string().lowercase().trim().optional(),
        }).optional(),
        utr: Joi.string().optional().trim(),
        remark: Joi.string().optional().trim(),
    }),
});


const paymentRequestController = require("../controllers/paymentRequestController.js");

router.post("/", createPaymentRequestSchema, paymentRequestController.createPaymentRequest);
router.get("/:id", paymentRequestController.getPaymentRequestById);
router.get("/", paymentRequestController.listPaymentRequests);

module.exports = router;