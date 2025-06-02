const axios = require("axios");
const generatePaysprintJWT = require("../../../services/Dmt&Aeps/TokenGenrate");

const getOperatorList = async (req, res) => {
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/recharge/recharge/getoperator",
      {}, // If body is required, provide here
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    if (response.data?.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Operator List Fetched",
        data: response.data,
      });
    } else if (response.data?.response_code === 0) {
      return res.status(200).json({
        status: "success",
        message: "No Operator Found",
        data: [],
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Unexpected response",
        data: response.data,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Failed to fetch operator list",
      error: error.message,
    });
  }
};

const doRecharge = async (req, res) => {
  const { operator, canumber, amount, referenceid } = req.body;

  // Basic input validation
  if (!operator || !canumber || !amount || !referenceid) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required fields: operator, canumber, amount, referenceid",
    });
  }

  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/recharge/recharge/dorecharge",
      {
        operator,
        canumber,
        amount,
        referenceid,
      },
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    switch (resData.response_code) {
      case 1:
        return res.status(200).json({
          status: "success",
          message: resData.message || "Recharge successful",
          data: resData,
        });

      case 2:
      case 0:
        return res.status(200).json({
          status: "pending",
          message: resData.message || "Please requery after 30 min",
          data: resData,
        });

      default:
        return res.status(400).json({
          status: "fail",
          message: resData.message || "Recharge failed",
          data: resData,
        });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        error.response?.data?.message || "Recharge API request failed",
      error: error.message,
    });
  }
};

const checkRechargeStatus = async (req, res) => {
  const { referenceid } = req.body;

  if (!referenceid) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required field: referenceid",
    });
  }

  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/recharge/recharge/status",
      {
        referenceid,
      },
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.status === true) {
      const txnStatus = resData.data?.status;

      if (txnStatus === 1) {
        return res.status(200).json({
          status: "success",
          message: "Recharge successful",
          data: resData.data,
        });
      } else if (txnStatus === 0) {
        return res.status(200).json({
          status: "failed",
          message: "Recharge failed",
          data: resData.data,
        });
      } else {
        return res.status(200).json({
          status: "pending",
          message: "Recharge status pending",
          data: resData.data,
        });
      }
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Status API returned failure",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Recharge status check failed",
      error: error.message,
    });
  }
};

const getBillOperatorList = async (req, res) => {
  const { mode = "online" } = req.body; // Defaults to online

  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bill-payment/bill/getoperator",
      { mode },
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Operator list fetched successfully",
        data: resData,
      });
    } else if (resData.response_code === 2) {
      return res.status(200).json({
        status: "success",
        message: "No operators found",
        data: [],
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Unexpected response from API",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Failed to fetch bill operator list",
      error: error.message,
    });
  }

};
// POST: /fetch-bill-details
const fetchBillDetails = async (req, res) => {
  const { operator, canumber, mode = "online", ...extraFields } = req.body;

  if (!operator || !canumber) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required fields: operator, canumber",
    });
  }

  try {
    const payload = {
      operator,
      canumber,
      mode,
      ...extraFields, // Includes optional ad1, ad2, etc.
    };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bill-payment/bill/fetchbill",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Bill fetched successfully",
        data: resData,
      });
    }

    if ([2, 3, 4, 7, 8, 9, 11].includes(resData.response_code)) {
      return res.status(200).json({
        status: "info",
        message: resData.message || "Biller returned information",
        data: resData,
      });
    }

    return res.status(400).json({
      status: "fail",
      message: resData.message || "Bill fetch failed",
      data: resData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Bill fetch API failed",
      error: error.message,
    });
  }
};
// POST: /pay-bill
const payBill = async (req, res) => {
  const {
    operator,
    canumber,
    amount,
    referenceid,
    latitude,
    longitude,
    mode = "online",
    bill_fetch,
  } = req.body;

  // Basic validation
  if (
    !operator ||
    !canumber ||
    !amount ||
    !referenceid ||
    !latitude ||
    !longitude ||
    !bill_fetch
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required fields or bill_fetch data",
    });
  }

  try {
    const payload = {
      operator,
      canumber,
      amount,
      referenceid,
      latitude,
      longitude,
      mode,
      bill_fetch,
    };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bill-payment/bill/paybill",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    switch (resData.response_code) {
      case 1:
        return res.status(200).json({
          status: "success",
          message: "Bill Payment Successful",
          data: resData,
        });

      case 0:
        return res.status(200).json({
          status: "pending",
          message: "Bill Payment Pending",
          data: resData,
        });

      case 14:
      case 9:
        return res.status(200).json({
          status: "failed",
          message: "Bill Payment Failed",
          data: resData,
        });

      default:
        return res.status(400).json({
          status: "fail",
          message: resData.message || "Bill payment not processed",
          data: resData,
        });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Bill payment API failed",
      error: error.message,
    });
  }
};
// POST: /check-bill-status
const checkBillPaymentStatus = async (req, res) => {
  const { referenceid } = req.body;

  if (!referenceid) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required field: referenceid",
    });
  }

  try {
    const payload = { referenceid };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bill-payment/bill/status",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.status === true) {
      const txnStatus = resData.data?.status;

      if (txnStatus === 1) {
        return res.status(200).json({
          status: "success",
          message: "Bill payment successful",
          data: resData,
        });
      } else if (txnStatus === 0) {
        return res.status(200).json({
          status: "failed",
          message: "Bill payment failed or refunded",
          data: resData,
        });
      } else {
        return res.status(200).json({
          status: "pending",
          message: "Bill payment status pending",
          data: resData,
        });
      }
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Status fetch failed",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Status check API failed",
      error: error.message,
    });
  }
};
// POST: /fetch-lic-bill-details
const fetchLICBillDetails = async (req, res) => {
  const { canumber, ad1, ad2, mode = "online" } = req.body;

  // Input validation
  if (!canumber || !ad1 || !ad2) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required fields: canumber, ad1 (email), ad2 (DOB)",
    });
  }

  try {
    const payload = { canumber, ad1, ad2, mode };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bill-payment/bill/fetchlicbill",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
        },
      }
    );

    const resData = response.data;

    // Handle based on response_code
    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "LIC bill fetched successfully",
        data: resData,
      });
    } else if ([0, 2, 3, 5, 7, 9].includes(resData.response_code)) {
      return res.status(200).json({
        status: "info",
        message: resData.message || "LIC biller returned info",
        data: resData,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to fetch LIC bill",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        error.response?.data?.message || "LIC bill fetch API failed",
      error: error.message,
    });
  }
};
// POST: /pay-lic-bill
const payLICBill = async (req, res) => {
  const {
    canumber,
    mode = "online",
    amount,
    ad1,
    ad2,
    ad3,
    referenceid,
    latitude,
    longitude,
    bill_fetch,
  } = req.body;

  // Basic validation
  if (
    !canumber ||
    !amount ||
    !ad1 ||
    !ad2 ||
    !referenceid ||
    !latitude ||
    !longitude ||
    !bill_fetch
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required fields. Please include all mandatory parameters.",
    });
  }

  try {
    const payload = {
      canumber,
      mode,
      amount,
      ad1,
      ad2,
      ad3,
      referenceid,
      latitude,
      longitude,
      bill_fetch,
    };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bill-payment/bill/paylicbill",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
        },
      }
    );

    const resData = response.data;

    switch (resData.response_code) {
      case 1:
        return res.status(200).json({
          status: "success",
          message: "LIC bill payment successful",
          data: resData,
        });
      case 0:
        return res.status(200).json({
          status: "pending",
          message: "LIC bill payment is pending, please requery later",
          data: resData,
        });
      case 2:
        return res.status(200).json({
          status: "failed",
          message: "LIC bill payment failed or refunded",
          data: resData,
        });
      default:
        return res.status(400).json({
          status: "fail",
          message: resData.message || "Unexpected response from LIC payment API",
          data: resData,
        });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "LIC bill payment API failed",
      error: error.message,
    });
  }
};
// POST: /check-lic-bill-status
const checkLICBillPaymentStatus = async (req, res) => {
  const { referenceid } = req.body;

  if (!referenceid) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required field: referenceid",
    });
  }

  try {
    const payload = { referenceid };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bill-payment/bill/licstatus",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
        },
      }
    );

    const resData = response.data;

    if (resData.status === true) {
      const txnStatus = resData.data?.status;

      if (txnStatus === 1) {
        return res.status(200).json({
          status: "success",
          message: "LIC bill payment successful",
          data: resData,
        });
      } else if (txnStatus === 0) {
        return res.status(200).json({
          status: "failed",
          message: "LIC bill payment failed or refunded",
          data: resData,
        });
      } else {
        return res.status(200).json({
          status: "pending",
          message: "LIC bill payment is pending",
          data: resData,
        });
      }
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Status fetch failed",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        error.response?.data?.message || "LIC bill status check API failed",
      error: error.message,
    });
  }
};



module.exports = {
  getOperatorList,
  doRecharge,
  checkRechargeStatus,
  getBillOperatorList,
  payBill,
  fetchBillDetails,
  checkBillPaymentStatus,
  fetchLICBillDetails,
  payLICBill,
  checkLICBillPaymentStatus

};
