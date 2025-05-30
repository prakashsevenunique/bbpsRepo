const mongoose = require("mongoose");
const PaymentRequest = require("../models/paymentRequest.js");
const User = require("../models/userModel.js");
const PayIn = require("../models/payInModel.js");

exports.createPaymentRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const paymentRequest = new PaymentRequest(req.body);
        await paymentRequest.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ success: true, data: paymentRequest });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error creating payment request:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPaymentRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentRequest = await PaymentRequest.findById(id);

        if (!paymentRequest) {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        return res.status(200).json({ success: true, data: paymentRequest });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.listPaymentRequests = async (req, res) => {
    try {
        const filter = {};

        // Apply filters from query params
        const {
            reference,
            type,
            mode,
            status,
            fromDate,
            toDate,
            userId,
        } = req.query;

        if (reference) filter.reference = reference;
        if (type) filter.type = type;
        if (mode) filter.mode = mode;
        if (status) filter.status = status;
        if (userId) filter.to = userId; // assuming 'to' is user in case of Credit

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const paymentRequests = await PaymentRequest.find(filter).sort("-createdAt");

        return res.status(200).json({
            success: true,
            count: paymentRequests.length,
            data: paymentRequests,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePaymentRequestStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { status, remark  } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const paymentRequest = await PaymentRequest.findById(id).session(session);
        if (!paymentRequest) {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        if (paymentRequest.status === status) {
            return res.status(400).json({
                success: false,
                message: "New status must be different from current",
            });
        }
        if (["Completed", "Failed", "Refunded"].includes(paymentRequest.status)) {
            return res.status(400).json({
                success: false,
                message: "Cannot update a finalized transaction",
            });
        }

        // Update status and remark
        paymentRequest.status = status;
        paymentRequest.completedAt = new Date();
        if (remark) paymentRequest.remark = remark;

        await paymentRequest.save({ session });

        // If status is Completed, update user wallet and create PayIn
        if (status === "Completed") {
            const user = await User.findById(paymentRequest.to || paymentRequest.from).session(session);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            // Add amount to wallet
            user.mainWallet += paymentRequest.amount;

            await user.save({ session });

            // Create PayIn entry
            const payIn = new PayIn({
                userId: user._id,
                amount: paymentRequest.amount,
                reference: paymentRequest.reference,
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                status: "Success",
                utr: paymentRequest.utr || null,
                remark: paymentRequest.description || "Payment completed via request",
            });

            await payIn.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            data: paymentRequest,
            message: `Payment request ${status === "Completed" ? "completed and wallet updated" : "status updated"}`,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error updating payment request status:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};