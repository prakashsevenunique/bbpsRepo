const mongoose = require('mongoose');
const PayIn = require('../models/payInModel');
const PayOut = require('../models/payOutModel');

const combinedReportForUser = async (req, res) => {
  try {
    const { userId, startDate, endDate, status, paymentGateway } = req.query;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Construct filters for PayIn and PayOut
    let payInFilter = { userId: new mongoose.Types.ObjectId(userId) };
    let payOutFilter = { userId: new mongoose.Types.ObjectId(userId) };

    // Apply date range filter if provided for both PayIn and PayOut
    if (startDate && endDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      };
      payInFilter.createdAt = dateFilter.createdAt;
      payOutFilter.createdAt = dateFilter.createdAt;
    }

    // Apply status filter if provided for both PayIn and PayOut
    if (status) {
      payInFilter.status = status;
      payOutFilter.status = status;
    }

    // Apply payment gateway filter for PayIn if provided
    if (paymentGateway) {
      payInFilter.paymentGateway = paymentGateway;
    }

    // Fetch PayIn and PayOut reports in parallel using Promise.all
    const [payIns, payOuts] = await Promise.all([
      PayIn.aggregate([
        { $match: payInFilter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            _id: 1,
            userId: 1,
            "userDetails.name": 1,
            "userDetails.email": 1,
            amount: 1,
            reference: 1,
            paymentGateway: 1,
            paymentMode: 1,
            status: 1,
            utr: 1,
            createdAt: 1,
            type: { $literal: "PayIn" }  // Mark it as PayIn
          }
        }
      ]),

      PayOut.aggregate([
        { $match: payOutFilter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            _id: 1,
            userId: 1,
            "userDetails.name": 1,
            "userDetails.email": 1,
            amount: 1,
            reference: 1,
            trans_mode: 1,
            account: 1,
            ifsc: 1,
            status: 1,
            txn_id: 1,
            createdAt: 1,
            type: { $literal: "PayOut" }  // Mark it as PayOut
          }
        }
      ])
    ]);

    // If no results found for both PayIns and PayOuts
    if (payIns.length === 0 && payOuts.length === 0) {
      return res.status(404).json({ success: false, message: "No records found for this user" });
    }

    // Combine PayIn and PayOut data into a single array
    const combinedData = [...payIns, ...payOuts];

    // Sort combined data by createdAt in descending order
    combinedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Return the combined data
    return res.status(200).json({ success: true, data: combinedData });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { combinedReportForUser };
