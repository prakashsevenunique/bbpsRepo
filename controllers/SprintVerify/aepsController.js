const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generatePaysprintJWT = require('../../services/Dmt&Aeps/TokenGenrate');
const OnboardTransaction = require('../../models/aepsModels/onboardingMerchants.js');

const headers = {
    'Token': generatePaysprintJWT(),
    'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
}

const BASE_URL = 'https://sit.paysprint.in/service-api/api/v1/service/onboard/onboardnew/getonboardurl';
const JWT_SECRET = 'UFMwMDE3OTIzYzdhYmFiZWU5OWJkMzAzNTEyNDQ0MmNmMGFiMWUyOA==';

const AES_KEY = '557aefe5593170ad'; // Must be 16 characters
const AES_IV = '7c4851aad3e91b9c';  // Must be 16 characters

const WADH = "18f4CEiXeXcfGXvgWA/blxD+w2pw7hfQPY45JMytkPw=";

// https://58e8-2401-4900-889a-511c-7849-49f2-bf5e-665e.ngrok-free.app/api/v1/aeps/onboard/callback?data=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWZubyI6IjE3NDk3MjkzNjM1OTgiLCJ0eG5pZCI6IiIsInN0YXR1cyI6IjAiLCJzdGF0dXNiYW5rMiI6IjAiLCJtb2JpbGUiOiI4MzAyODQ1OTc2IiwicGFydG5lcmlkIjoiUFMwMDE3OTIiLCJtZXJjaGFudGNvZGUiOiIxMDEiLCJiYW5rIjp7IkJhbmsxIjowLCJCYW5rMiI6MH19.43H-EtcfhddKtBwYPXvTmETJg6NkrTyMVAMbYMPiSf8


const decryptJWT = (token, secretKey) => {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (error) {
        throw new Error("JWT Decryption Failed: " + error.message);
    }
};

function encryptPidData(piddata) {
    const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(AES_KEY, "utf8"), Buffer.from(AES_IV, "utf8"));
    let encrypted = cipher.update(piddata, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}

function encrypt(data) {
    const jsonData = JSON.stringify(data); // Convert object to JSON string
    const cipher = crypto.createCipheriv(
        'aes-128-cbc',
        Buffer.from(AES_KEY, 'utf8'),
        Buffer.from(AES_IV, 'utf8')
    );

    let encrypted = cipher.update(jsonData, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted; // This is the encrypted Base64 string
}


exports.generateOnboardURL = async (req, res) => {
    const { merchantcode, mobile, email, firm, callback } = req.body;
    const payload = {
        merchantcode,
        mobile,
        is_new: "0",
        email,
        firm,
        callback
    };
    try {
        const response = await axios.post(BASE_URL, payload, {
            headers
        });
        if (response.data.status) {
            await OnboardTransaction.create({
                user_id: req.user.id,
                merchantcode,
                mobile,
                email,
                firm,
                callback
            });

            return res.json({
                redirectUrl: response.data.redirecturl,
                message: 'Onboarding initiated successfully.'
            });
        } else {
            return res.status(400).json({ message: 'Failed to initiate onboarding.', error: response.data.message });
        }
    } catch (error) {
        console.error(error.response?.data || error.message);
        return res.status(500).json({ message: 'Internal Server Error.' });
    }
};

exports.transactionCallback = async (req, res) => {
    console.log("transaction callback", req.body)
    const { param, param_inc } = req.body;
    let decryptedParam;
    try {
        decryptedParam = decryptJWT(param_inc, JWT_SECRET);
    } catch (e) {
        return res.status(400).json({ status: 400, message: "Invalid encrypted data." });
    }
    const { merchant_id, partner_id, request_id, amount } = decryptedParam;

    console.log(`Deducting ₹${amount} from Merchant: ${merchant_id}`);

    return res.json({ status: 200, message: "Transaction completed successfully" });
};

exports.updateOnboardTransaction = async (req, res, next) => {
    try {
        const { id, refno, merchantcode, status, txnid, partnerid, callback, email, firm, bank } = req.body;

        if (!id) {
            return res.status(400).json({ error: true, message: "Transaction ID is required" });
        }

        const updateFields = {};

        if (status) updateFields.status = status;
        if (txnid) updateFields.txnid = txnid;
        if (partnerid) updateFields.partnerid = partnerid;
        if (callback) updateFields.callback = callback;
        if (email) updateFields.email = email;
        if (firm) updateFields.firm = firm;
        if (bank) updateFields.bank = bank;
        updateFields.callbackReceivedAt = new Date();

        const updatedTransaction = await OnboardTransaction.findOneAndUpdate({ merchantcode, _id: id }, { $set: updateFields }, { new: true });

        if (!updatedTransaction) {
            return res.status(404).json({ error: true, message: "Transaction not found" });
        }

        res.status(200).json({
            success: true,
            message: "Transaction updated successfully",
        });
    } catch (error) {
        return next(error);
    }
};


exports.onboardResponseCallback = async (req, res) => {
    const { data } = req.query;
    let decryptedData;
    try {
        decryptedData = decryptJWT(data, JWT_SECRET);
    } catch (e) {
        return res.status(400).json({ message: "Decryption failed." });
    }
    const { refno, txnid, status, mobile, partnerid, merchantcode, bank } = decryptedData;
    if (status === "1" || status === "0") {
        await OnboardTransaction.findOneAndUpdate(
            { merchantcode },
            {
                refno,
                txnid,
                status: status === "1" ? "Success" : "Pending",
                mobile,
                partnerid,
                bank,
                callbackReceivedAt: new Date()
            },
            { new: true, upsert: true }
        );
    }
    return res.json({ data: decryptedData, message: "Callback received" });
};

exports.activateMerchant = async (req, res, next) => {
    const {
        merchantcode,
        aadhaar,
        piddata = `<PidData>....</PidData>`,
        dob,
        is_casa = '0'
    } = req.body;

    if (!merchantcode || !aadhaar || !piddata || !dob) {
        return res.status(400).json({
            status: false,
            message: "Missing required parameters."
        });
    }
    try {
        const encryptedPID = encryptPidData(piddata);
        const payload = {
            merchantcode,
            aadhaar,
            piddata: encryptedPID,
            dob,
            is_casa
        };
        const response = await axios.post('https://sit.paysprint.in/service-api/api/v1/service/onboard/onboard/activate_merchant', payload, {
            headers
        });
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error activating merchant:", error);
        return next(error)
    }
};

exports.checkOnboardStatus = async (req, res, next) => {

    const { merchantcode, mobile, pipe } = req.body;

    if (!merchantcode || !mobile || !pipe) {
        return res.status(400).json({
            status: false,
            response_code: 8,
            message: "Missing required parameters: merchantcode, mobile, pipe"
        });
    }
    try {
        const payload = {
            merchantcode,
            mobile,
            pipe
        };
        const response = await axios.post("https://sit.paysprint.in/service-api/api/v1/service/onboard/onboard/getonboardstatus", payload, {
            headers
        });
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error checking onboarding status:", error.message);
        return next(error)
    }
};

exports.registerMerchant = async (req, res, next) => {
    const ipaddre =
        req.headers['x-forwarded-for']?.split(',')[0] ||  // If behind proxy
        req.socket?.remoteAddress ||                      // Direct connection
        req.connection?.remoteAddress;
    try {
        const {
            accessmodetype,
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris,
            timestamp = new Date(),
            data = `<PidData>....</PidData>`,
            ipaddress = "9.9.9.9"
        } = req.body;

        if (!referenceno || !submerchantid || !timestamp) {
            return res.status(400).json({
                status: false,
                response_code: 8,
                message: "Missing required parameters."
            });
        }

        const payload = {
            accessmodetype: accessmodetype || 'SITE',
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris: is_iris || 'No',
            timestamp,
            data,
            ipaddress
        };

        const encryptedBody = encrypt(payload)
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/aeps/kyc/Twofactorkyc/registration',
            { body: encryptedBody },
            { headers }
        );
        return res.status(response.status).json(response.data);
    } catch (error) {
        return next(error)
    }
};


exports.authenticateMerchant = async (req, res) => {
    try {
        const {
            accessmodetype,
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris,
            timestamp = Date.now(),
            data = `<PidData>....</PidData>`,
            ipaddress = "9.9.9.9"
        } = req.body;

        if (!referenceno || !submerchantid || !timestamp) {
            return res.status(400).json({
                status: false,
                response_code: 8,
                message: "Missing required parameters."
            });
        }

        const payload = {
            accessmodetype: accessmodetype || 'APP',
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris: is_iris || 'No',
            timestamp,
            data,
            ipaddress
        };

        const encryptedBody = encrypt(payload);

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/aeps/kyc/Twofactorkyc/authentication',
            { body: encryptedBody },
            { headers }
        );

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error("Error during authentication:", error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

exports.balanceEnquiry = async (req, res, next) => {
    try {
        const {
            latitude,
            longitude,
            mobilenumber,
            adhaarnumber,
            nationalbankidentification,
            ipaddress = "192.168.1.67",
            referenceno,
            accessmodetype = "SITE",
            requestremarks = "",
            data = `<PidData>....</PidData>`,
            pipe = "bank1",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            transactiontype = "BE",
            submerchantid = "1",
            is_iris = "No"
        } = req.body;

        if (!latitude || !longitude || !mobilenumber) {
            return res.status(400).json({ error: true, message: "Missing mandatory fields" });
        }

        const plainBody = {
            latitude, longitude, mobilenumber, referenceno, ipaddress,
            adhaarnumber, accessmodetype, nationalbankidentification,
            requestremarks, data, pipe, timestamp,
            transactiontype, submerchantid, is_iris
        };

        const encryptedBody = encrypt(plainBody);

        const { data: psResp } = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/balanceenquiry/index",
            { body: encryptedBody },
            { headers }
        );
        return res.json(psResp);
    } catch (err) {
        return next(err);
    }
};

exports.withdrawWithAuth = async (req, res, next) => {
    try {
        const {
            latitude,
            longitude,
            mobilenumber,
            adhaarnumber,
            nationalbankidentification,
            ipaddress = req.ip,
            referenceno,
            accessmodetype = "WEB",
            requestremarks = "",
            data,
            pipe = "bank2",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            transactiontype = "CW",
            submerchantid = "1",
            amount,
            is_iris = "No"
        } = req.body;

        if (!latitude || !longitude || !mobilenumber || !adhaarnumber || !data || !amount || !nationalbankidentification) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const plainBody = {
            latitude,
            longitude,
            mobilenumber,
            referenceno,
            ipaddress,
            adhaarnumber,
            accessmodetype,
            nationalbankidentification,
            requestremarks,
            data,
            pipe,
            timestamp,
            transactiontype,
            submerchantid,
            amount,
            is_iris
        };
        const encryptedBody = encrypt(plainBody);
        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/authcashwithdraw/index",
            { body: encryptedBody },
            {
                headers,
                timeout: 180000
            }
        );
        return res.json(response.data);
    } catch (err) {
        return res.status(500).json({ error: true, message: "Internal Server Error", details: err.message });
    }
};

exports.getMiniStatement = async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            mobilenumber,
            adhaarnumber,
            nationalbankidentification,
            data,
            pipe = "bank2",
            ipaddress = req.ip,
            accessmodetype = "SITE",
            referenceno,
            requestremarks = "",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            submerchantid,
            is_iris = "No"
        } = req.body;

        if (!latitude || !longitude || !mobilenumber || !adhaarnumber || !data || !nationalbankidentification) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const plainBody = {
            latitude,
            longitude,
            mobilenumber,
            referenceno,
            ipaddress,
            adhaarnumber,
            accessmodetype,
            nationalbankidentification,
            requestremarks,
            data,
            pipe,
            timestamp,
            transactiontype: "MS",
            submerchantid,
            is_iris
        };

        const encryptedBody = encrypt(plainBody);

        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/ministatement/index",
            { body: encryptedBody },
            {
                headers,
                timeout: 180000
            }
        );
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.getAepsBankList = async (req, res, next) => {
    try {
        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps//banklist/index",
            {},
            { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};
