const { default: axios } = require("axios");
const User = require("../models/userModel");
const jwt = require('jsonwebtoken');
require("dotenv").config();


function generateToken() {
  return jwt.sign({}, "18fc02b675bfa38fbb3350b18e0fc45cf3740bd3be6104e4d310188943d09535", {
    algorithm: "HS256",
  });
};

const aadhaarVerify = async (req, res, next) => {
  const { aadharNumber } = req.body;
  const id_number = aadharNumber
  if (!aadharNumber) {
    res.send("Aadhar Number is required");
  }
  try {
    const generateOtpResponse = await axios.post(`https://api.7uniqueverfiy.com/api/verify/adhar/send/otp`, { id_number: id_number, }, {
      headers: {
        "client-id": 'Seven012',
        "authorization": `Bearer ${generateToken()}`,
        "x-env": "production",
        "Content-Type": "application/json",
      }
    });
    return res.send({
      message: "OTP send successful",
      data: generateOtpResponse.data,
    });
  } catch (error) {
    console.log(error);
    return next(error)
  }
};

const submitAadharOTP = async (req, res) => {
  const { otp, client_id } = req.body;
  let user = await User.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const generateOtpResponse = await axios.post(`https://api.7uniqueverfiy.com/api/verify/adhar/verify/otp
`, {
    method: "POST",
    headers: {

      "client-id": 'Seven012',
      "authorization": `Bearer ${generateToken()}`,
      "x-env": "production",
      // ❌ DO NOT manually set Content-Type for FormData
    },
    body: requestData,
  });
  const nameFromAadhar = submitOtpResponse?.data?.data;

  if (
    submitOtpResponse.data &&
    submitOtpResponse.data.message_code === "success"
  ) {
    user.aadharDetails = nameFromAadhar;
    await user.save();
    return res.send({
      message: "Aadhaar verification successful",
      data: submitOtpResponse.data,
      name: nameFromAadhar,
    });
  } else {
    return res.send("Aadhaar verification failed");
  }
};

const verifyBank = async (req, res) => {
  const { id_number, ifsc } = req.body;
  let user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  try {
    if (!id_number || !ifsc) {
      return res
        .status(400)
        .json({ success: false, message: "IFSC number or ID is missing" });
    }
    const url = "https://api.7uniqueverfiy.com/api/verify/bankVerify/v2";
    const response = await axios.post(
      url,
      {
       account_number: id_number,
        ifsc_code:ifsc,
        
      },
      {
        headers: {

          "client-id": 'Seven012',
          "authorization": `Bearer ${generateToken()}`,
          "x-env": "production",
        
        },
      }
    );
    const nameFromBank = response.data.data;
    user.bankDetails = nameFromBank;
    await user.save();

    return res
      .status(200)
      .json({ pandata: response.data, success: true, name: nameFromBank });
  } catch (error) {
    console.error("Error in verifyBank:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error verifying bank details" });
  }
};

const verifyPAN = async (req, res) => {
  const { id_number } = req.body;

  console.log("🔍 PAN Verification Requested for:", id_number);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("❌ User not found:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    if (!id_number) {
      console.log("⚠️ PAN number is missing in request body");
      return res
        .status(400)
        .json({ success: false, message: "PAN number missing" });
    }

    const url = "https://api.7uniqueverfiy.com/api/verify/pan_verify";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${generateToken()}`,
      "Client-id": 'Seven012',
      "x-env": "production"
    };

    console.log("🌐 Sending request to:", url);
    console.log("📦 Request Headers:", headers);

    const response = await axios.post(url, { pannumber: id_number }, { headers });

    console.log("✅ API Response:", response.data);

    const nameFromPAN = response.data.data;
    user.panDetails = nameFromPAN;
    await user.save();

    return res
      .status(200)
      .json({ success: true, name: nameFromPAN, data: response.data });

  } catch (error) {
    console.error("❌ PAN Verification Error:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error verifying PAN details" });
  }
};

const normalizeName = (name) => {
  const prefixList = ["Mr", "Ms", "Mrs", "Dr"];
  prefixList.forEach((prefix) => {
    if (name.startsWith(prefix)) {
      name = name.replace(prefix, "").trim();
    }
  });
  name = name.toLowerCase().replace(/\s+/g, " ");
  return name;
};

const userVerify = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return "User not found!";
  }
  const normalizedAadharName = normalizeName(user.aadharDetails.full_name);
  const normalizedPanName = normalizeName(user.panDetails.full_name);
  const normalizedBankName = normalizeName(user.bankDetails.full_name);

  if (
    normalizedAadharName == normalizedPanName &&
    normalizedPanName == normalizedBankName
  ) {
    user.isKycVerified = true;
    await user.save();
    return res.status(200).send("user verified successfully");
  }
  user.aadharDetails = {};
  user.panDetails = {};
  user.bankDetails = {};

  user.isKycVerified = false;
  await user.save();

  return res
    .status(400)
    .send("Dismatched User details please Correct the information");
};

const updateBankAccount = async (req, res) => {
  const { id_number, ifsc } = req.body;
  let user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const normalizedAadharName = normalizeName(user.aadharDetails.full_name);
  const normalizedPanName = normalizeName(user.panDetails.full_name);
  try {
    if (!id_number || !ifsc) {
      return res.status(400).json({ success: false, message: "IFSC number or ID is missing" });
    }
    const url = "https://kyc-api.surepass.io/api/v1/bank-verification/";
    const response = await axios.post(
      url,
      { id_number, ifsc, ifsc_details: true },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    );

    const nameFromBank = response.data.data.full_name;
    const normalizedBankName = normalizeName(nameFromBank);

    if (normalizedAadharName === normalizedBankName && normalizedPanName === normalizedBankName) {
      user.bankDetails = response.data.data; // Update bank details
      await user.save();
      return res.status(200).json({ success: true, message: "Bank details updated successfully", data: response.data });
    } else {
      return res.status(400).json({ success: false, message: "Bank account name mismatch with Aadhaar & PAN" });
    }

  } catch (error) {
    console.error("Error updating bank account:", error.message);
    return res.status(500).json({ success: false, message: "Error updating bank details" });
  }
};



module.exports = {
  aadhaarVerify,
  submitAadharOTP,
  verifyBank,
  verifyPAN,
  userVerify,
  updateBankAccount
};
