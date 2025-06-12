const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generatePaysprintJWT = require('../../services/Dmt&Aeps/TokenGenrate');

const headers = {
    'Token': generatePaysprintJWT(),
    'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
}

const BASE_URL = 'https://sit.paysprint.in/service-api/api/v1/service/onboard/onboardnew/getonboardurl';
const RESPONSE_CALLBACK_URL = 'https://3d7e-2401-4900-1c7a-756b-ad93-aa4e-dca2-1548.ngrok-free.app/api/v1/aeps/onboard/callback';
const JWT_SECRET = 'UFMwMDE3OTIzYzdhYmFiZWU5OWJkMzAzNTEyNDQ0MmNmMGFiMWUyOA==';


const WADH = "18f4CEiXeXcfGXvgWA/blxD+w2pw7hfQPY45JMytkPw=";

const AES_KEY = '7c4851aad3e91b9c!'; // Must be 16 characters
const AES_IV = '557aefe5593170ad';  // Must be 16 characters

const encryptPIDData = (pidData, key = Buffer.from(WADH, 'base64'), iv = Buffer.alloc(16, 0)) => {
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(pidData, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
};

const decryptJWT = (token, secretKey) => {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (error) {
        throw new Error("JWT Decryption Failed: " + error.message);
    }
};

function encryptAES128(data, key, iv) {
    const keyBuffer = Buffer.from(key, 'utf8');
    const ivBuffer = Buffer.from(iv, 'utf8');

    if (keyBuffer.length !== 16) {
        throw new Error('Key must be 16 bytes long for AES-128');
    }
    if (ivBuffer.length !== 16) {
        throw new Error('IV must be 16 bytes long');
    }

    const cipher = crypto.createCipheriv('aes-128-cbc', keyBuffer, ivBuffer);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

exports.generateOnboardURL = async (req, res) => {
    const { merchantcode, mobile, email, firm } = req.body;

    const payload = {
        merchantcode,
        mobile,
        is_new: "0",
        email,
        firm,
        callback: RESPONSE_CALLBACK_URL
    };

    try {
        const response = await axios.post(BASE_URL, payload, {
            headers
        });
        if (response.data.status) {
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

exports.onboardResponseCallback = async (req, res) => {
    const { data } = req.query;
    let decryptedData;
    try {
        decryptedData = decryptJWT(data, JWT_SECRET);
    } catch (e) {
        return res.status(400).json({ message: "Decryption failed." });
    }
    const { refno, txnid, status, mobile, partnerid, merchantcode, bank } = decryptedData;
    console.log(decryptedData)
    if (status === "1") {
        console.log(`✅ Onboarding successful for merchant: ${merchantcode}`);
    } else {
        console.log(`⏳ Onboarding pending for merchant: ${merchantcode}`);
    }
    return res.send("Callback received");
};

exports.activateMerchant = async (req, res) => {
    const {
        merchantcode,
        aadhaar,
        piddata,
        dob,
        is_casa = '0'
    } = req.body;

    if (!merchantcode || !aadhaar || !piddata || !dob) {
        return res.status(400).json({
            status: false,
            response_code: 8,
            message: "Missing required parameters."
        });
    }

    try {
        const encryptedPID = encryptPIDData(piddata);
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
        console.error("Error during activation:", error.message);
    }
};

exports.checkOnboardStatus = async (req, res) => {
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
    }
};

exports.registerMerchant = async (req, res) => {
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
            timestamp,
            data,
            ipaddress
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

        const encryptedBody = encryptAES128(payload, AES_KEY, AES_IV);

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/aeps/kyc/Twofactorkyc/registration',
            { body: encryptedBody },
            { headers }
        );
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error during registration:", error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: "Internal Server Error." });
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
            timestamp,
            data,
            ipaddress
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

        const encryptedBody = encryptAES128(payload, AES_KEY, AES_IV);

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
            ipaddress = req.ip,
            referenceno,
            accessmodetype = "APP",
            requestremarks = "",
            data,
            pipe = "bank2",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            transactiontype = "BE",
            submerchantid = "1",
            is_iris = "No"
        } = req.body;

        if (!latitude || !longitude || !mobilenumber || !data) {
            return res.status(400).json({ error: true, message: "Missing mandatory fields" });
        }

        const plainBody = {
            latitude, longitude, mobilenumber, referenceno, ipaddress,
            adhaarnumber, accessmodetype, nationalbankidentification,
            requestremarks, data, pipe, timestamp,
            transactiontype, submerchantid, is_iris
        };

        const encryptedBody = encryptAES128(plainBody, AES_KEY, AES_IV);

        const { data: psResp } = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/balanceenquiry/index",
            { body: encryptedBody },
            { headers, timeout: 180000 }
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
        const encryptedBody = encryptAES128(plainBody, AES_KEY, AES_IV);
        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/authcashwithdraw/index",
            { body: encryptedBody },
            {
                headers,
                timeout: 180000
            }
        );
        console.log("AEPS Auth Withdraw Success", { referenceno, response: response.data });
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
            accessmodetype = "APP",
            referenceno = uuidv4(),
            requestremarks = "",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            submerchantid = "1",
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

        const encryptedBody = encryptAES128(plainBody, AES_KEY, AES_IV);

        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/ministatement/index",
            { body: encryptedBody },
            {
                headers,
                timeout: 180000
            }
        );

        console.log("Mini Statement Success", { referenceno, response: response.data });
        return res.json(response.data);

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.getAepsBankList = async (req, res) => {
    try {
        const response = await axios.post(
            BANK_LIST_URL,
            {},
            { headers }
        );
        console.log("AEPS Bank List Fetch Success", { ...response.data });
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bank list",
            error: error.message
        });
    }
};
