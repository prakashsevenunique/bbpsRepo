const User = require("../../models/userModel");
const ServicePlan = require("../../models/servicePlanmodel");
const mongoose = require("mongoose");
const PayOut = require("../../models/payOutModel");
const { default: axios } = require("axios");

const assignPlan = async (req, res) => {
  try {
    const { userId, planId, planType } = req.body;

    // ✅ Validate user
    const user = await User.findById(userId);
    // console.log("user is:", user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Validate plan
    const plan = await ServicePlan.findById(planId);
    console.log("plan is: ", plan);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // ✅ Find plan amount based on selected type
    const selectedPlan = plan.amount.find((amt) => amt.type === planType);
    console.log("selected plan is : ", selectedPlan);
    if (!selectedPlan) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    const userWallet = await axios.get(
      `https://finpay-backend.onrender.com/api/admin/userwallet/${userId}`
    );

    const walletData = userWallet.data?.data;
    if (!walletData) {
      return res.status(400).json({ error: "Wallet data not found" });
    }

    console.log("user wallet is: ", walletData);

    // ✅ Check wallet balance
    if (walletData.availableBalance < selectedPlan.value) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    // ✅ Deduct wallet balance through Payout
    const newPayOut = new PayOut({
      userId: new mongoose.Types.ObjectId(user._id), 
      amount: selectedPlan.value,
      name: user.name,
      mobile: user.mobileNumber,
      email: user.email,
      status: "Approved",
    });

    // Save the record to MongoDB
    await newPayOut.save();

    // ✅ Calculate plan duration and set start and end date
    const startDate = new Date();
    let endDate;
    switch (planType) {
      case "monthly":
        endDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
        break;
      case "quarterly":
        endDate = new Date(startDate.setMonth(startDate.getMonth() + 3));
        break;
      case "half-yearly":
        endDate = new Date(startDate.setMonth(startDate.getMonth() + 6));
        break;
      case "yearly":
        endDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
        break;
    }

    // ✅ Assign the plan
    user.plan = {
      planId: plan._id,
      planType,
      startDate: new Date(),
      endDate,
    };

    user.status = "Approved";

    // ✅ Save updated user data
    await user.save();

    res.status(200).json({ message: "Plan assigned successfully", user });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Schedule plan removal after duration ends
// const schedulePlanRemoval = (userId, endDate) => {
//   const durationMs = endDate - new Date();
//   setTimeout(async () => {
//     const user = await User.findById(userId);
//     if (user) {
//       user.plan = {
//         planId: null,
//         planType: null,
//         startDate: null,
//         endDate: null,
//       };
//       user.status = "Pending";
//       await user.save();
//       console.log(`Plan removed for user ${user.name}`);
//     }
//   }, durationMs);
// };

module.exports = { assignPlan };
