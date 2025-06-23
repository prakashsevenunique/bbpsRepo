const User = require("../models/userModel.js");
const { generateOtp, verifyOtp } = require("../services/otpService");
const { sendOtp } = require("../services/smsService");
const { generateJwtToken } = require("../services/jwtService");
const { parse } = require('json2csv');
const userMetaModel = require("../models/userMetaModel.js");
const PayIn = require("../models/payInModel.js");
const PayOut = require("../models/payOutModel.js");

const sendOtpController = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }
    const otp = await generateOtp(mobileNumber);
    const smsResult = await sendOtp(mobileNumber, otp);
    if (smsResult.success) {
      return res.status(200).json({ message: "OTP sent successfully" });
    } else {
      return res.status(400).json({ message: smsResult.message });
    }
  } catch (error) {
    console.error("Error in sendOtpController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOTPController = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required" });
    }
    const verificationResult = await verifyOtp(mobileNumber, otp);
    if (!verificationResult.success) {
      return res.status(400).json({ message: verificationResult.message });
    }

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error in verifyOTPController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginController = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required" });
    }
    const verificationResult = await verifyOtp(mobileNumber, otp);
    if (!verificationResult.success) {
      return res.status(400).json({ message: verificationResult.message });
    }
    let user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    if (user.status === false) {
      return res.status(403).json({ message: "Your account is blocked. Please contact support." });
    }

    const token = generateJwtToken(user._id, user.role, user.mobileNumber);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        token
      },
    });
  } catch (error) {
    console.error("Error in loginController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, mobileNumber, address, pinCode, mpin, role, distributorId } = req.body;

    let user = await User.findOne({ email, mobileNumber });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    let adminUser;
    if (!distributorId) {
      adminUser = await User.findOne({ role: 'Admin' });
    }
    let NewUser = await User.create({ name, email, mobileNumber, address, pinCode, mpin, role, isAccountActive: role == "User" ? true : false, distributorId: distributorId ? distributorId : adminUser?._id });

    let newUser = await NewUser.save();
    const token = generateJwtToken(newUser._id, newUser.role, newUser.mobileNumber);

    return res.status(200).json({
      message: "Registration successful",
      newUser,
      token
    });
  } catch (error) {
    console.error("Error in registerUser controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfileController = async (req, res) => {
  try {
    const { name, email, mpin, bankDetails, address, pinCode } = req.body;

    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (mpin) user.mpin = mpin;
    if (bankDetails) user.bankDetails = bankDetails;
    if (address) {
      user.address = {
        fullAddress: address.fullAddress,
        city: address.city,
        state: address.state,
        country: address.country || 'India'
      };
    }
    if (pinCode) user.pinCode = pinCode;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in updateProfileController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserController = async (req, res) => {
  try {
    let user = await User.findById(req.user.id, '-mpin -commissionPackage -meta -aadharDetails -panDetails');
    let userMeta = await userMetaModel.findOne({ userId: req.user.id }).populate('services.serviceId', '-providers -serviceFor') || {};
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.status(200).json({ user, userMeta });
  } catch (error) {
    console.error("Error in getUserController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUsersWithFilters = async (req, res) => {
  try {
    const {
      keyword,
      role,
      from,
      to,
      sortBy = 'name',
      order = 'asc',
      page = 1,
      limit = 10,
      exportCsv = 'false'
    } = req.query;

    const filter = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const loggedInUser = req.user;

    if (loggedInUser.role === 'Distributor') {
      filter.distributorId = loggedInUser.id;
    }

    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .sort(sort)
      .skip(exportCsv === 'true' ? 0 : skip)
      .limit(exportCsv === 'true' ? Number.MAX_SAFE_INTEGER : parseInt(limit));

    if (exportCsv === 'true') {
      const fields = [
        '_id',
        'name',
        'email',
        'role',
        'mobileNumber',
        'status',
        'distributorId',
        'isKycVerified',
        'eWallet',
        'cappingMoney',
        'createdAt',
        'updatedAt'
      ];

      const csv = parse(users, { fields });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=users.csv');
      return res.send(csv);
    }
    const totalUsers = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
    });
  } catch (error) {
    console.error("Error in getUsersWithFilters:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;

    if (!userId || status === undefined) {
      return res.status(400).json({ message: "User ID and status are required" });
    }
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.status = status;
    await user.save();
    return res.status(200).json({
      message: "User status updated successfully",
      user: {
        id: user._id,
        name: user.name,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    const { role, status, isAccountActive, commissionPackage, cappingMoney, eWallet, meta } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (role) user.role = role;
    if (status !== undefined) user.status = status;
    if (commissionPackage) user.commissionPackage = commissionPackage;
    if (isAccountActive !== undefined) user.isAccountActive = isAccountActive;
    if (cappingMoney !== undefined) user.cappingMoney = cappingMoney;
    if (eWallet !== undefined) user.eWallet = eWallet;
    if (meta) user.meta = meta;

    await user.save();
    return res.status(200).json({
      message: "User details updated successfully"
    });
  } catch (error) {
    console.error("Error in updateUserDetails:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const Transaction = require('../models/transactionModel.js');

const getDashboardSummary = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let userFilter = {};
    let payUserIds = [];
    let eWalletUserIds = [];

    // Determine users under scope
    if (role === "retailer") {
      userFilter = { userId: mongoose.Types.ObjectId(userId) };
      payUserIds = [userId];
      eWalletUserIds = [userId];

    } else if (role === "distributor") {
      const retailers = await User.find({ distributorId: userId, role: 'Retailer' }).select('_id');
      const retailerIds = retailers.map(r => r._id.toString());
      payUserIds = [userId, ...retailerIds];
      eWalletUserIds = [userId, ...retailerIds];
      userFilter = { userId: { $in: retailerIds.map(id => mongoose.Types.ObjectId(id)) } };

    } else if (role === "admin") {
      userFilter = {};
      const allUsers = await User.find().select('_id');
      const allUserIds = allUsers.map(u => u._id.toString());
      payUserIds = allUserIds;
      eWalletUserIds = allUserIds;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Transaction Summary
    const [totalTxn, todayTxn, statusCount, totalAmt, topBillers] = await Promise.all([
      Transaction.countDocuments(userFilter),
      Transaction.countDocuments({ ...userFilter, createdAt: { $gte: today } }),
      Transaction.aggregate([
        { $match: userFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...userFilter, status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Transaction.aggregate([
        { $match: userFilter },
        { $group: { _id: "$biller", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    let walletBalance = 0;
    if (eWalletUserIds.length > 0) {
      const wallets = await User.find({ _id: { $in: eWalletUserIds.map(id => mongoose.Types.ObjectId(id)) } }).select("eWallet");
      walletBalance = wallets.reduce((sum, user) => sum + (user.eWallet || 0), 0);
    }

    const payIn = await PayIn.aggregate([
      { $match: { userId: { $in: payUserIds.map(id => mongoose.Types.ObjectId(id)) }, status: "Success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

     const payOut = await PayOut.aggregate([
      { $match: { userId: { $in: payUserIds.map(id => mongoose.Types.ObjectId(id)) }, status: "Success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const success = statusCount.find(e => e._id === "success")?.count || 0;
    const failed = statusCount.find(e => e._id === "failed")?.count || 0;
    const total = success + failed;
    const successRate = total ? ((success / total) * 100).toFixed(2) + '%' : '0%';
    const failureRate = total ? ((failed / total) * 100).toFixed(2) + '%' : '0%';

    const response = {
      totalTransactions: totalTxn,
      todayTransactions: todayTxn,
      successRate,
      failureRate,
      totalAmount: totalAmt[0]?.total || 0,
      walletBalance: parseFloat(walletBalance.toFixed(2)),
      topBillers,
      totalPayIn: payIn[0]?.total || 0,
      totalPayOut: payOut[0]?.total || 0,
    };

    if (role === "admin") {
      response.totalRetailers = await User.countDocuments({ role: "Retailer" });
      response.totalDistributors = await User.countDocuments({ role: "Distributor" });
    }

    if (role === "distributor") {
      response.totalRetailers = await User.countDocuments({ distributorId: userId, role: 'Retailer' });
    }
    return res.json(response);
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

module.exports = {
  sendOtpController,
  verifyOTPController,
  registerUser,
  loginController,
  updateProfileController,
  getUserController,
  getUsersWithFilters,
  updateUserStatus,
  updateUserDetails,
  getDashboardSummary
};