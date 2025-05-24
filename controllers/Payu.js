const axios = require("axios");
const crypto = require("crypto");
const PayIn = require("../models/payInModel");

const generatePayUHash = ({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  salt,
}) => {
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
};

const payIn = async (req, res) => {
  const { amount, reference, name, mobile, email, userId, vpa } = req.body;

  if (!amount || !reference || !name || !mobile || !email || !userId || !vpa) {
    return res.status(400).send("All fields are required");
  }

  const key = "DgCRom";
  const salt = "yBKguIy4V5vWEwO3WRj86yjD7GtS5Pe3";
  const txnid = "123453";
  const productinfo = "UPI Payin";

  const hash = generatePayUHash({
    key,
    txnid,
    amount,
    productinfo,
    firstname: name,
    email,
    salt,
  });

  const payUData = {
    key,
    txnid,
    amount,
    productinfo,
    firstname: name,
    email,
    phone: mobile,
    surl: "https://yourdomain.com/payment/success",
    furl: "https://yourdomain.com/payment/failure",
    hash,
    pg: "UPI",
    bankcode: "UPI",
    vpa,
    txn_s2s_flow: "4",
    s2s_client_ip: req.ip,
    s2s_device_info: req.headers["user-agent"],
  };

  try {
    const payuResponse = await axios.post(
      process.env.PAYU_BASE_URL,
      new URLSearchParams(payUData).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    await new PayIn({
      userId,
      amount,
      reference,
      name,
      mobile,
      email,
      vpa,
      status: "initiated",
    }).save();

    return res.status(200).send({
      message: "Payment Initiated",
      payuHtml: payuResponse.data,
    });
  } catch (err) {
    console.error("PayU Error", err.response?.data || err.message);
    return res.status(500).send("Something went wrong while initiating payment");
  }
};

module.exports = { payIn };
