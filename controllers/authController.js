const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Wallet = require("../models/walletModel");
const { generateOtp, verifyOtp } = require("../services/otpService");
const { sendOtp } = require("../services/smsService");
const { generateJwtToken } = require("../services/jwtService");
const { default: axios } = require("axios");
require("dotenv").config();
const token = process.env.TOKEN;
const mongoose = require("mongoose");
//console.log(token);

// Send OTP to the user
const sendOtpController = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    // Generate OTP
    const otp = await generateOtp(mobileNumber);

    // Send OTP via SMS
    const smsResult = await sendOtp(mobileNumber, otp);
    //console.log("otp", smsResult);

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
 
// Verify OTP controller
const verifyOTPController = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required" });
    }

    // Verify OTP
    const verificationResult = await verifyOtp(mobileNumber, otp);

    if (!verificationResult.success) {
      return res.status(400).json({ message: verificationResult.message });
    }

    return res.status(200).json({
      message: "OTP verified successful",
    });
  } catch (error) {
    console.error("Error in verifyOTPController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Verify OTP and login user
const loginController = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required" });
    }

    // Verify OTP
    const verificationResult = await verifyOtp(mobileNumber, otp);

    if (!verificationResult.success) {
      return res.status(400).json({ message: verificationResult.message });
    }

    let user = await User.findOne({ mobileNumber });


    if (!user) {
      return res.status(404).json("No user found");
    }

    const token = generateJwtToken(user._id);

    user.token = token;
    await user.save();

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        token: user.token,
        role: user.role
      },
    });
  } catch (error) {
    console.error("Error in loginController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, mobileNumber, mpin, role, distributorId} = req.body;

    let user = await User.findOne({ email }); 

    if (user) {
      return res.status(400).json("User already exists");
    }

    // let crptPass = await bcrypt
    //   .hash(password, 10)
    //   .then((hash) => {
    //     return hash;
    //   })
    //   .catch((err) => console.error("Error hashing password:", err.message));

if(role === 'Retailer'){
  user = await User.create({ name, email, mobileNumber, mpin, role, distributorId });
}else{
  user = await User.create({ name, email, mobileNumber, mpin, role });
}
   

    // Initialize wallcsccschdakkskdh priya
    await Wallet.create({ userId: user._id, balance: 0 });
    
    await user.save();

    return res.status(200).json({
      message: "Registration successful",
      user: user,
    });
  } catch (error) {
    console.error("Error in registerUser controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfileController = async (req, res) => {
  try {
    const { userId, name, email, mobileNumber} = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user profile with new name and email 
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if (mobileNumber) {
      user.mobileNumber = mobileNumber;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
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
    let user = await User.findById(req.params.id).populate("plan"); // ✅ "ServicePlan" को populate करें

    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    user = user.toObject(); // Convert Mongoose document to plain object
    console.log("User is: ", user);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; 

const getRetailersByDistributor = async (req, res) => {
  try {
    const distributorId = new mongoose.Types.ObjectId(req.params.id);

    const retailers = await User.find({ distributorId, role: 'Retailer' });

    res.status(200).json({ success: true, data: retailers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


module.exports = {
  sendOtpController,
  verifyOTPController,
  registerUser,
  loginController,
  getUserController,
  updateProfileController,
  getRetailersByDistributor
};
