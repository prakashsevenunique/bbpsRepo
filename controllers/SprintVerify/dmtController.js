const axios = require('axios');
const generatePaysprintJWT = require("../../services/Dmt&Aeps/TokenGenrate");
const { encryptPidData } = require('../../services/jwtService');
const crypto = require('crypto');
const dmtBeneficiary = require('../../models/dmtBeneficiary');

const headers = {
    'Token': generatePaysprintJWT(),
    'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
}

exports.queryRemitter = async (req, res, next) => {
    try {
        const { mobile, lat, long } = req.body;
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/remitter/queryremitter',
            { mobile: Number(mobile), lat, long },
            { headers }
        );
        return res.status(200).json(response.data);

    } catch (error) {
        console.error(error.response?.data || error.message);
        return next(error)
    }
};

exports.remitterEkyc = async (req, res, next) => {
    try {
        const {
            mobile,
            lat,
            long,
            aadhaar_number,
            piddata,
            accessmode = 'WEB',
            is_iris = 2
        } = req.body;

        const key = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16);
        const encryptedData = encryptPidData(`${piddata}`, key, iv);

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
            { headers }
        );
        return res.status(200).json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.registerRemitter = async (req, res, next) => {
    try {
        const { mobile, otp, stateresp, ekyc_id } = req.body;

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/remitter/registerremitter',
            {
                "mobile": Number(mobile),
                "otp": otp,
                "stateresp": stateresp,
                "ekyc_id": ekyc_id
            },
            { headers }
        );
        return res.status(200).json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.registerBeneficiary = async (req, res, next) => {
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
            { headers }
        );
        if (response.data?.response_code === 1) {
            const newBeneficiary = new dmtBeneficiary({
                user_id: req.user.id,
                mobile,
                benename,
                bankid,
                accno,
                ifsccode,
                address,
                pincode,
                type:"Dmt Beneficiary"
            });
            await newBeneficiary.save();
        }
        return res.json({ ...response.data });
    } catch (error) {
        console.error(error.response?.data || error.message);
        return next(error)
    }
};

exports.deleteBeneficiary = async (req, res, next) => {
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
            { headers }
        );
        return res.json({ ...response.data });
    } catch (error) {
        return next(error)
    }
};

exports.fetchBeneficiary = async (req, res, next) => {
    try {
        const { mobile } = req.query;
        if (!mobile) {
            return res.status(400).json({ error: true, message: "mobile is required" });
        }
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/fetchbeneficiary',
            { mobile }, { headers }
        );
        return res.json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.BeneficiaryById = async (req, res, next) => {
    try {
        const { mobile, beneid } = req.query;

        if (!mobile) {
            return res.status(400).json({ error: true, message: "mobile is required" });
        }

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/fetchbeneficiarybybeneid',
            { mobile, beneid }, { headers }
        );

        return res.json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.PennyDrop = async (req, res, next) => {
    try {
        const { mobile, accno, bankid, benename, referenceid, pincode, address, dob, gst_state, bene_id } = req.body;

        if (!mobile) {
            return res.status(400).json({ error: true, message: "mobile is required" });
        }

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/benenameverify',
            { mobile, accno, bankid, benename, referenceid, pincode, address, dob, gst_state, bene_id },
            { headers }
        );
        return res.json({ ...response.data });
    } catch (error) {
        return next(error)
    }
};

exports.sendTransactionOtp = async (req, res, next) => {
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

        if (!mobile || !referenceid || !bene_id || !amount) {
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
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.performTransaction = async (req, res, next) => {
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
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.TrackTransaction = async (req, res, next) => {
    try {
        const {
            referenceid,
        } = req.body;

        if (!referenceid) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const payload = {
            referenceid,
        };
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact/querytransact',
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.RefundOtp = async (req, res, next) => {
    try {
        const {
            referenceid,
            ackno
        } = req.body;
        if (!referenceid || !ackno) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const payload = {
            referenceid,
            ackno
        };
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/refund/refund/resendotp',
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.Refund = async (req, res, next) => {
    try {
        const {
            referenceid,
            ackno, otp
        } = req.body;

        if (!referenceid || !ackno || !otp) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const payload = {
            referenceid,
            ackno, otp
        };
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/refund/refund',
            payload, { headers }
        );
        return res.json({ ...response.data, message: response.data.message });

    } catch (error) {
        return next(error)
    }
};