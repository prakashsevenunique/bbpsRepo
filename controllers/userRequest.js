const User = require("../models/userModel");
const PayIn = require("../models/payInModel");
const PayOut = require("../models/payOutModel");
const mongoose = require("mongoose");

const { userWallet } = require("../services/mainWalletService");

const userRequest = async (req, res) => {
  try {
    const { customer_name, amount, utr, transferMode, remark, reference } =
      req.body;
    console.log(req.body);

    let user = await User.findOne({ name: customer_name });
    if (!user) {
      return res.status(404).send("No User Found");
    }

    const newPayIn = new PayIn({
      userId: new mongoose.Types.ObjectId(user._id),
      amount,
      reference,
      name: user.name,
      mobile: user.mobileNumber,
      email: user.email,
      status: "Pending",
      utr,
      trans_mode: transferMode,
      remark,
    });

    // Save the record to MongoDB
    await newPayIn.save();

    return res.status(200).send("Payment request is successful");
  } catch (error) {
    console.log("Internal server Error", error);
    return res.status(500).send("Internal Server Error");
  }
};

const adminAction = async (req, res) => {
  const { action, reference } = req.body;
  const payin = await PayIn.findOne({ reference });
  console.log("szdxfcgv", payin);
  if (!payin) {
    return res.status(404).send("No payout transaction found");
  }

  if (action === "APPROVE") {
    try {
      payin.adminAction = "Approved";
      payin.status = "Approved";
      await payin.save();
    } catch (error) {
      console.error("Error calling external payin service:", error);
      return res
        .status(500)
        .send("Internal server error while calling external payin service");
    }
  } else {
    payin.adminAction = "Rejected";
    payin.status = "Failed"; // Mark as failed if rejected
    await payin.save();
    return res.status(400).send("Payin Request rejected by admin");
  }
};

module.exports = { userRequest, adminAction };
