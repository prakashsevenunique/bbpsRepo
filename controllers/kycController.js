const User = require("../models/userModel");
const { default: axios } = require("axios");
require("dotenv").config();

const aadhaarVerify = async (req, res) => {
    const { aadharNumber } = req.body;
    if (!aadharNumber) {
      res.send("Aadhar Number is required");
    }
    try {
    
      const generateOtpResponse = await axios.post(
        "https://kyc-api.surepass.io/api/v1/aadhaar-v2/generate-otp",
        {
          id_number: aadharNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      );
      //console.log(generateOtpResponse.data);
      return res.send({
        message: "OTP send successful",
        data: generateOtpResponse.data,
      });
    } catch (error) {
      console.error("Error during Aadhaar verification:", error.message);
      return res
        .status(500)
        .send("An error occurred during Aadhaar verification");
    }
  };
  
  const submitAadharOTP = async (req, res) => {
    const { otp, client_id, userId } = req.body;
    let user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    const submitOtpResponse = await axios.post(
      "https://kyc-api.surepass.io/api/v1/aadhaar-v2/submit-otp",
      {
        client_id: client_id, 
        otp: otp,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOKEN}`, 
        },
      }
    );
    //console.log(submitOtpResponse.data.data);
    const nameFromAadhar = submitOtpResponse.data.data;
    //console.log("name in aadhar card", nameFromAadhar);
    user.aadharDetails = nameFromAadhar;
    await user.save();
  
    if (
      submitOtpResponse.data &&
      submitOtpResponse.data.message_code === "success"
    ) {
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
    const { id_number, ifsc, userId } = req.body;
    let user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    try {
      if (!id_number || !ifsc) {
        return res
          .status(400)
          .json({ success: false, message: "IFSC number or ID is missing" });
      }
  
      const url = "https://kyc-api.surepass.io/api/v1/bank-verification/";
  
      const response = await axios.post(
        url,
        {
          id_number,
          ifsc,
          ifsc_details: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      );
  
      //console.log("Surepass API Response:", response.data);
      const nameFromBank = response.data.data;
      //console.log("name in bank account", nameFromBank);
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
    const { id_number, userId } = req.body;
    let user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    try {
      if (!id_number) {
        return res
          .status(400)
          .json({ success: false, message: "IFSC number missing" });
      }
  
      const url = "https://kyc-api.surepass.io/api/v1/pan/pan";
  
      const response = await axios.post(
        url,
        {
          id_number,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      );
  
      //console.log("Surepass API Response:", response.data);
  
      const nameFromPAN = response.data.data;
      //console.log("name in pancard", nameFromPAN);
      user.panDetails = nameFromPAN;
      await user.save();
  
      return res
        .status(200)
        .json({ success: true, name: nameFromPAN, data: response.data });
    } catch (error) {
      console.error("Error in pancard:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Error verifying pan details" });
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
    const { userId } = req.body;
    const user = await User.findById(userId);
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
    const { userId, id_number, ifsc } = req.body;
    let user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Normalize names
    const normalizedAadharName = normalizeName(user.aadharDetails.full_name);
    const normalizedPanName = normalizeName(user.panDetails.full_name);

    try {
        if (!id_number || !ifsc) {
            return res.status(400).json({ success: false, message: "IFSC number or ID is missing" });
        }

        // Call Surepass API for bank verification
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

        // Check if Aadhaar & PAN name matches with new bank name
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
  