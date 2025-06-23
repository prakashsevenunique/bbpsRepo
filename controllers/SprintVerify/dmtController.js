const axios = require('axios');
const generatePaysprintJWT = require("../../services/Dmt&Aeps/TokenGenrate");
const { encryptPidData } = require('../../services/jwtService');
const crypto = require('crypto');
const dmtBeneficiary = require('../../models/dmtBeneficiary');
const DmtReport = require('../../models/dmtTransactionModel.js');
const PayOut = require("../../models/payOutModel.js")
const Transaction = require("../../models/transactionModel.js");
const userModel = require("../../models/userModel.js");
const mongoose = require('mongoose');
const getDmtOrAepsMeta = require('../../utils/aeps&DmtCommmsion.js');
const { calculateCommissionFromSlabs, getApplicableServiceCharge } = require('../../utils/chargeCaluate.js');

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
                type: "Dmt Beneficiary"
            });
            await newBeneficiary.save();
        }
        return res.json({ ...response.data });
    } catch (error) {
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            mobile,
            accno,
            bankid,
            benename,
            referenceid,
            pincode,
            address,
            dob,
            gst_state,
            bene_id
        } = req.body;

        const { commissionPackage } = await getDmtOrAepsMeta(req.user.id, "DMT");

        const amount = commissionPackage?.dmtPennyDrop || 0;
        const userId = req.user.id;

        const missingFields = [];
        if (!mobile) missingFields.push("mobile");
        if (!accno) missingFields.push("accno");
        if (!benename) missingFields.push("benename");
        if (!referenceid) missingFields.push("referenceid");
        if (missingFields.length > 0) {
            return res.status(400).json({ error: true, message: `Missing fields: ${missingFields.join(", ")}` });
        }

        const user = await userModel.findById(userId).session(session);
        if (!user || user.eWallet < amount) {
            throw new Error("Insufficient wallet balance (Minimum ₹10 required)");
        }

        user.eWallet -= amount;
        await user.save({ session });

        const [debitTxn] = await Transaction.create([{
            user_id: userId,
            transaction_type: "debit",
            amount,
            balance_after: user.eWallet,
            payment_mode: "wallet",
            transaction_reference_id: referenceid,
            description: "Penny Drop Verification for DMT",
            status: "Pending"
        }], { session });

        await PayOut.create([{
            userId,
            amount,
            reference: referenceid,
            trans_mode: "IMPS",
            name: benename,
            mobile,
            email: user.email,
            status: "Pending",
            charges: 0,
            remark: `Penny Drop verification for ${accno} for DMT`
        }], { session });

        // ✅ API call
        const payload = {
            mobile,
            accno,
            bankid,
            benename,
            referenceid,
            pincode,
            address,
            dob,
            gst_state,
            bene_id
        };

        const { data: result } = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/benenameverify',
            payload,
            { headers }
        );

        if (result.status === true && result.response_code == 1) {
            await DmtReport.create([{
                user_id: userId,
                status: result.status,
                ackno: result.ackno || "",
                referenceid: result.referenceid || referenceid,
                utr: result.utr || "",
                txn_status: 1,
                benename: result.beneficiary_name || benename,
                remarks: result.message || "Verified",
                message: result.message || "",
                remitter: mobile,
                account_number: accno,
                gatewayCharges: {
                    bc_share: 0,
                    txn_amount: amount,
                    customercharge: 0,
                    gst: 0,
                    tds: 0,


                    netcommission: 0,
                },
                charges: {
                    distributor: 0,
                    admin: 0
                },
                NPCI_response_code: result.response_code,
                bank_status: result.message || ""
            }], { session });

            await Promise.all([
                PayOut.updateOne({ reference: referenceid }, { $set: { status: "Success" } }).session(session),
                Transaction.updateOne({ transaction_reference_id: referenceid }, { $set: { status: "Success" } }).session(session)
            ]);

            debitTxn.status = "Success";
            await debitTxn.save({ session });

        } else {
            user.eWallet += amount;
            await user.save({ session });

            await Promise.all([
                Transaction.updateOne({ transaction_reference_id: referenceid }, { $set: { status: "Failed" } }).session(session),
                PayOut.updateOne({ reference: referenceid }, { $set: { status: "Failed" } }).session(session)
            ]);

            throw new Error(result.message || "Penny Drop failed");
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Penny drop verification completed",
            data: result
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(error);
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
    const session = await mongoose.startSession();
    session.startTransaction();

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
        
        await getApplicableServiceCharge(req.user.id, "DMT");

        const { commissionPackage } = await getDmtOrAepsMeta(req.user.id, "DMT");

        if (!commissionPackage?.isActive) {
            return res.status(400).json({ success: false, message: "DMT package not active for this user" });
        }

        let userId = req.user.id;

        const missingFields = [];
        if (!mobile) missingFields.push('mobile');
        if (!referenceid) missingFields.push('referenceid');
        if (!bene_id) missingFields.push('bene_id');
        if (!txntype) missingFields.push('txntype');
        if (!amount) missingFields.push('amount');
        if (!otp) missingFields.push('otp');
        if (!stateresp) missingFields.push('stateresp');

        if (missingFields.length > 0) {
            return res.status(400).json({ error: true, message: `Missing required fields: ${missingFields.join(', ')}` });
        }

        let commission = calculateCommissionFromSlabs(amount, commissionPackage?.slabs || [])

        const user = await userModel.findById(userId).session(session);
        if (!user) {
            return res.status(404).json({ error: true, message: "User not found" });
        }

        if (user.eWallet < (Number(amount) + commission.totalCommission)) {
            return res.status(400).json({ error: true, message: "Insufficient wallet balance" });
        }

        user.eWallet -= (Number(amount) + commission.totalCommission);

        await user.save({ session });

        const [debitTxn] = await Transaction.create([{
            user_id: userId,
            transaction_type: "debit",
            amount: Number(amount),
            balance_after: user.eWallet,
            payment_mode: "wallet",
            transaction_reference_id: referenceid,
            description: "DMT Transfer",
            status: "Pending"
        }], { session });

        await new PayOut({
            userId,
            amount: Number(amount),
            reference: referenceid,
            trans_mode: txntype,
            name: user.name,
            mobile: user.mobileNumber,
            email: user.email,
            status: "Pending",
            charges: commission.totalCommission,
            remark: `Money Transfer for beneficiary ID ${bene_id}`
        }).save({ session });

        const payload = {
            mobile, referenceid, bene_id, txntype, amount,
            otp, stateresp, pincode, address, dob,
            gst_state, lat, long
        };

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact',
            payload,
            { headers }
        );

        const result = response?.data || {};

        // ✅ Step 6: Handle Response from API
        if (result.status === true && result.txn_status === 1) {
            await DmtReport.create([{
                user_id: userId,
                status: result.status,
                ackno: result.ackno,
                referenceid: result.referenceid,
                utr: result.utr,
                txn_status: result.txn_status,
                benename: result.benename,
                remarks: result.remarks,
                message: result.message,
                remitter: result.remitter,
                account_number: result.account_number,
                gatewayCharges: {
                    bc_share: parseFloat(result.bc_share || 0),
                    txn_amount: parseFloat(result.txn_amount || amount),
                    customercharge: parseFloat(result.customercharge || 0),
                    gst: parseFloat(result.gst || 0),
                    tds: parseFloat(result.tds || 0),
                    netcommission: parseFloat(result.netcommission || 0),
                },
                charges: {
                    distributor: 0,
                    admin: commission.totalCommission
                },
                NPCI_response_code: result.NPCI_response_code || '',
                bank_status: result.bank_status || ''
            }], { session });

            await Promise.all([
                PayOut.updateOne({ reference: referenceid }, { $set: { status: "Success" } }).session(session),
                Transaction.updateOne({ transaction_reference_id: referenceid }, { $set: { status: "Success" } }).session(session)
            ]);

            debitTxn.status = "Success";
            await debitTxn.save({ session });
        } else {
            user.eWallet += Number(amount + commission.totalCommission);
            await user.save({ session });

            await Promise.all([
                Transaction.updateOne({ transaction_reference_id: referenceid }, { $set: { status: "Failed" } }).session(session),
                PayOut.updateOne({ reference: referenceid }, { $set: { status: "Failed" } }).session(session)
            ]);

            throw new Error(result.message || "Transaction failed at provider");
        }

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json(result);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
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