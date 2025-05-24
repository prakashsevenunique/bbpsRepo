const { default: axios } = require("axios");
const PayIn = require("../models/payInModel");
const User = require("../models/userModel");
const CommissionPackage = require("../models/commissionModel");

const mongoose = require("mongoose");

const payIn = async (req, res) => {
  const { amount, reference, name, mobile, email, userId } = req.body;

  if (!amount || !reference || !name || !mobile || !email || !userId) {
    return res.send("All fields are required");
  }

  const payInData = await axios.post(
    "https://api.worldpayme.com/api/v1.1/createUpiIntent",
    {
      amount,
      reference,
      name,
      email,
      mobile,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI4IiwianRpIjoiOTcwY2YwZTE1NjcxMGIwZDQ3ZWZlOWY0ZWNjYmJkZDMxNjhmNWMxODc3MzE4ZTgwNzdmNmVmNTczOTZlZDIyNjkwNTZiOWNiZTFmNTBlMjEiLCJpYXQiOjE3NDA5NzgxMzkuOTk5MjM0LCJuYmYiOjE3NDA5NzgxMzkuOTk5MjM1LCJleHAiOjE3NzI1MTQxMzkuOTk2NjgxLCJzdWIiOiIyMzciLCJzY29wZXMiOltdfQ.lakPf6sw_uhlkeLzX0iWt3YAkeC4lJd-lici6uc_of4EIEJjMakV9xr77rv35jpNbw2QYDWpVbtNYMZeAWIaX5T9TnbPtI0_J0yyUr6WoKmNtV6xjCU5rJz-QGuLgvg-uurNxsWXW2mo3j3t202fvZPsCdY0PzLlWzDiLQJ8DjKIK10oLagBR7WANafjNujtX84A9wy9xYX1LDNwQtI6d6EjMg4TKwt3MazawXh57TjFC7X4bYMlSNshvCXICMSEQ8z_20GZqBAXtjguPjAmzpgVMD7hcMn4iGLP4Oqfo0hD36xvcszWk62IxsBlNHzwf9SJ6tEqWjJKZ7m36uOT79UEXJXQiPkguqbKZ2G3nQu8HN4rm0ccOFqnqKloNaDQJtbVn9N0PPN_ho_RqrNhA02Ut-BdTWbH8-y2DCQNHJeuf8Iee0f934dlnZPaNC76RHhgyKmsc2eaSmpEr9SGe6P-4BJ-pIJkkyl7xHCT4pu2t9Elt7lpjQW_BwztEZ8SJQNQVkv5hvXrtC-KAdnJ7ZAzMPxmCjSaFRgMGLnHr_iQiS8rTgfQFGBXSK4NXXVClaf0-EFoYIVIWUkhgoDMDJKmcjCDLPxOyjOfGy8Ha3oHvMzalEcLGX13f8a4EzzGPcZ3ZSfo3iqbBTNeFkgMr-39I5d9L5iAGYNz4wFiKA8`,
      },
    }
  );
  if (payInData.data) {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const commission = await CommissionPackage.findOne({
      userId: user._id,
      serviceType: "Payin",
      minAmount: { $lte: amount },
      maxAmount: { $gte: amount },
    });

    if (!commission) {
      return res.status(400).send("No commission package configured for user.");
    }

    // Calculate commissions
    let adminCommission = 0;
    let distributorCommission = 0;
    let charges = 0;
    let gst = 0;
    let tds = 0;

    const amountNum = parseFloat(amount);

    if (commission.type === "percentage") {
      adminCommission = (amountNum * commission.commission) / 100;
      distributorCommission =
        (amountNum * commission.distributorCommission) / 100;
      charges = (amountNum * commission.charges) / 100;
      gst = (amountNum * commission.gst) / 100;
      tds = (amountNum * commission.tds) / 100;
    } else {
      adminCommission = commission.commission;
      distributorCommission = commission.distributorCommission;
      charges = commission.charges;
      gst = commission.gst;
      tds = commission.tds;
    }

    const totalDeductions =
      parseFloat(adminCommission) +
      parseFloat(distributorCommission) +
      parseFloat(charges) +
      parseFloat(gst) +
      parseFloat(tds);
    const payInAmount = amountNum - totalDeductions;

    const payInAmountInt = Math.round(payInAmount);
    const payInAmountStr = payInAmountInt.toString();
       
    console.log("payInAmount is:", payInAmountStr);
   

    const newPayIn = new PayIn({
      userId: new mongoose.Types.ObjectId(userId), // Ensuring the userID is a valid ObjectId
      amount: payInAmountStr,
      reference,
      name,
      mobile,
      email,
      adminCommission,
      distributorCommission,
      charges,
      gst,
      tds,
    });

    // Save the record to MongoDB
    await newPayIn.save();
    return res.status(200).send({
      data: payInData.data,
      status: payInData.data.status,
      message: "Payment data saved successfully in the database.",
    });
  } else {
    return res.status(400).send("bad request");
  }
};

// const callbackPayIn = async (req, res) => {
//   try {
//     const data = req.body;
//     console.log("data in callback request: ", data);
//     const payin = await PayIn.findOne({ reference: data.reference });

//     if (!payin) {
//       return res.status(404).json({ message: "Transaction not found" });
//     }

//     if (data.status === "Success") {

//       // Update PayIn Transaction
//       payin.status = "Approved";
//       payin.utr = data.utr;
//       await payin.save();

//       // // Log Transaction History
//       // await Transaction.create({
//       //   userId: retailer._id,
//       //   type: "PayIn",
//       //   amount: payin.amount,
//       //   status: "Success",
//       //   reference: data.reference
//       // });

//       return res.status(200).json({ message: "PayIn successful", payin });
//     }

//     // Handle Failed Transaction
//     payin.status = "Failed";
//     await payin.save();

//     return res.status(400).json({ message: "Payment Failed", payin });
//   } catch (error) {
//     console.error("Error in callback response", error);
//     return res.status(500).json({ message: "Something went wrong" });
//   }
// };

const callbackPayIn = async (req, res) => {
  try {
    const data = req.body;
    console.log("data in callback request: ", data);
    const payin = await PayIn.findOne({ reference: data.reference });

    if (!payin) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    let redirectUrl = ""; // Initialize the redirect URL

    if (data.status === "Success") {
      // Update PayIn Transaction
      payin.status = "Approved";
      payin.utr = data.utr;
      await payin.save();

      // Success - Redirect user to success page
      redirectUrl = "/payment/success";
    } else {
      // Handle Failed Transaction
      payin.status = "Failed";
      await payin.save();

      // Failure - Redirect user to failure page
      redirectUrl = "/payment/failure";
    }

    // Send the redirect URL in response or send the redirect directly
    return res.redirect(redirectUrl); // Redirecting user to the corresponding page
  } catch (error) {
    console.error("Error in callback response", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getPayInRes = async (req, res) => {
  const { reference } = req.query;
  const payin = await PayIn.findOne({ reference });
  if (!payin) {
    return res.status(404).send("No data found");
  }
  return res.status(200).send(payin);
};

const payInReportAllUsers = async (req, res) => {
  try {
    const { userId, startDate, endDate, status, paymentGateway } = req.query; // Query Parameters

    let filter = {};

    if (userId) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }
    if (status) {
      filter.status = status; // Pending, Approved, Failed
    }
    if (paymentGateway) {
      filter.paymentGateway = paymentGateway; // Razorpay, Paytm, etc.
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Aggregation Pipeline
    const payIns = await PayIn.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
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
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({ success: true, data: payIns });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const payInReportForUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const { startDate, endDate, status, paymentGateway } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    let filter = { userId: new mongoose.Types.ObjectId(userId) }; // Filter by userId

    if (status) {
      filter.status = status; // Pending, Approved, Failed
    }
    if (paymentGateway) {
      filter.paymentGateway = paymentGateway; // Razorpay, Paytm, etc.
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Aggregation Pipeline
    const payIns = await PayIn.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users", // Assuming the 'users' collection is named "users"
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", // Unwind the userDetails array to get a single object
      },
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
        },
      },
      { $sort: { createdAt: -1 } }, // Sort by creation date descending
    ]);

    // Check if any results were found
    if (payIns.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No pay-in records found for this user",
        });
    }

    return res.status(200).json({ success: true, data: payIns });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const payinUserCount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Get the sum for each status category: Approved, Pending, Failed
    const results = await Promise.all([
      // Approved
      PayIn.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: "Approved",
          },
        },
        { $group: { _id: null, totalApproved: { $sum: "$amount" } } },
      ]),

      // Pending
      PayIn.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: "Pending",
          },
        },
        { $group: { _id: null, totalPending: { $sum: "$amount" } } },
      ]),

      // Failed
      PayIn.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: "Failed",
          },
        },
        { $group: { _id: null, totalFailed: { $sum: "$amount" } } },
      ]),
    ]);

    // Extract the sums from the results of the aggregation
    const totalApproved = results[0][0]?.totalApproved || 0;
    const totalPending = results[1][0]?.totalPending || 0;
    const totalFailed = results[2][0]?.totalFailed || 0;

    // Return the results as a JSON response
    res.status(200).json({
      totalApproved,
      totalPending,
      totalFailed,
    });
  } catch (error) {
    console.error("Error getting total sums: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  payIn,
  callbackPayIn,
  getPayInRes,
  payInReportAllUsers,
  payInReportForUser,
  payinUserCount,
};
