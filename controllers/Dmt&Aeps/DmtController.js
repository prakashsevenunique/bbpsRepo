const axios = require('axios');
const {  encryptPidData } = require("../../services/Dmt&Aeps/TokenGenrate");
const  generatePaysprintJWT = require("../../services/Dmt&Aeps/TokenGenrate");

// -----------------------------
// Query Remitter Controller
// -----------------------------
const queryRemitter = async (req, res) => {
  try {
    const { mobile, lat, long } = req.body;

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/remitter/queryremitter',
      { mobile: Number(mobile), lat, long },
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};

// -----------------------------
// Remitter E-KYC Controller
// -----------------------------
const remitterEKyc = async (req, res) => {
  try {
    const {
      mobile,
      lat,
      long,
      aadhaar_number,
      piddata,
      accessmode,
      is_iris = 2
    } = req.body;

    const key = "your-16-byte-key"; // must be 16 bytes
    const iv = "your-16-byte-iv";   // must be 16 bytes
    const encryptedData = encryptPidData(piddata, key, iv);

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/remitter/queryremitter/kyc',
      {
        mobile: Number(mobile),
        lat,
        long,
        aadhaar_number,
        data: encryptedData,
        accessmode,
        is_iris
      },
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};

// -----------------------------
// Register Beneficiary Controller
// -----------------------------
const registerBeneficiary = async (req, res) => {
  try {
    const {
      mobile,
      benename,
      bankid,
      accno,
      ifsccode,
      verified,
      gst_state,
      dob,
      address,
      pincode
    } = req.body;

    const payload = {
      mobile,
      benename,
      bankid,
      accno,
      ifsccode,
      verified,
      ...(gst_state && { gst_state }),
      ...(dob && { dob }),
      ...(address && { address }),
      ...(pincode && { pincode })
    };

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary',
      payload,
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};



// -----------------------------
// Delete Beneficiary Controller
// -----------------------------
const deleteBeneficiary = async (req, res) => {
  try {
    const { mobile, bene_id } = req.body;

    if (!mobile || !bene_id) {
      return res.status(400).json({ error: true, message: "mobile and bene_id are required" });
    }

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/deletebeneficiary',
      {
        mobile,
        bene_id
      },
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error("❌ Delete Beneficiary Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};
// Fetch Beneficiary Controller
// -----------------------------
const fetchBeneficiary = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: true, message: "mobile is required" });
    }

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/fetchbeneficiary',
      { mobile },
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error("❌ Fetch Beneficiary Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};
// Fetch Beneficiary by id Controller
// -----------------------------
const BeneficiaryById = async (req, res) => {
  try {
    const { mobile,beneid } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: true, message: "mobile is required" });
    }

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/fetchbeneficiarybybeneid',
      { mobile ,beneid},
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error("❌ Fetch Beneficiary Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};
// peeny drop Controller
// -----------------------------
const PennyDrop = async (req, res) => {
  try {
    const {mobile,accno,bankid,benename,referenceid,pincode,address,dob,gst_state,bene_id} = req.body;

    if (!mobile) {
      return res.status(400).json({ error: true, message: "mobile is required" });
    }

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/benenameverify',
      { mobile ,accno,bankid,benename,referenceid,pincode,address,dob,gst_state,bene_id},
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(res);
    

    return res.json({ data: response.data });


  } catch (error) {
    console.error("❌ Fetch Beneficiary Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};


// -----------------------------
// Send OTP for Transaction
// -----------------------------
const sendTransactionOtp = async (req, res) => {
  try {
    const {
      mobile,
      referenceid,
      bene_id,
      txntype,
      amount,
      pincode = "110015",
      address = "New Delhi",
      dob = "01-01-1990",
      gst_state = "07",
      lat = "28.786543",
      long = "78.345678"
    } = req.body;

    if (!mobile || !referenceid || !bene_id || !txntype || !amount) {
      return res.status(400).json({ error: true, message: "Missing required fields" });
    }

    const payload = {
      mobile,
      referenceid,
      bene_id,
      txntype,
      amount,
      pincode,
      address,
      dob,
      gst_state,
      lat,
      long
    };

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact/send_otp',
      payload,
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(res);
    

    return res.json({ data: response.data });

  } catch (error) {
    console.error("❌ Send OTP Transaction Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};
// -----------------------------
// Perform DMT Transaction
// -----------------------------
const performTransaction = async (req, res) => {
  try {
    const {
      mobile,
      referenceid,
      bene_id,
      txntype,
      amount,
      otp,
      stateresp,
      pincode = "110015",
      address = "New Delhi",
      dob = "01-01-1990",
      gst_state = "07",
      lat = "28.786543",
      long = "78.345678"
    } = req.body;

    if (!mobile || !referenceid || !bene_id || !txntype || !amount || !otp || !stateresp) {
      return res.status(400).json({ error: true, message: "Missing required fields" });
    }

    const payload = {
      mobile,
      referenceid,
      bene_id,
      txntype,
      amount,
      otp,
      stateresp,
      pincode,
      address,
      dob,
      gst_state,
      lat,
      long
    };

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact',
      payload,
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error("❌ Transaction Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};
// -----------------------------
// track Transaction
// -----------------------------
const TrackTransaction = async (req, res) => {
  try {
    const {
      referenceid,
     
    } = req.body;

    if (!referenceid ) {
      return res.status(400).json({ error: true, message: "Missing required fields" });
    }

    const payload = {
      referenceid,
     
    };

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact/querytransact',
      payload,
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error("❌ Transaction Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};
// -----------------------------
// Refund otp
// -----------------------------
const RefundOtp = async (req, res) => {
  try {
    const {
      referenceid,
      ackno
     
    } = req.body;

    if (!referenceid ||!ackno ) {
      return res.status(400).json({ error: true, message: "Missing required fields" });
    }

    const payload = {
      referenceid,
      ackno
     
    };

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/refund/refund/resendotp',
      payload,
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data });

  } catch (error) {
    console.error("❌ refund Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
};
// -----------------------------
// Refund 
// -----------------------------
const Refund = async (req, res) => {
  try {
    const {
      referenceid,
      ackno,otp
     
    } = req.body;

    if (!referenceid ||!ackno ||!otp) {
      return res.status(400).json({ error: true, message: "Missing required fields" });
    }

    const payload = {
      referenceid,
      ackno,otp
     
    };

    const response = await axios.post(
      'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/refund/refund',
      payload,
      {
        headers: {
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({ data: response.data ,message:response.data.message });

  } catch (error) {
    console.error("❌ refund Error:", error.response?.data || error.message);
    return res.status(500).json({ error: true, message: error });
  }
};



module.exports = {
  queryRemitter,
  remitterEKyc,
  registerBeneficiary,
  deleteBeneficiary,
  fetchBeneficiary,
  BeneficiaryById,
  PennyDrop,
  sendTransactionOtp,
  performTransaction,
  TrackTransaction,
  RefundOtp,
  Refund
};
