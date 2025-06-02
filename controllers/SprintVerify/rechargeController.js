const axios = require("axios");
const generatePaysprintJWT = require("../../services/Dmt&Aeps/TokenGenrate.js");
const BbpsHistory = require("../../models/bbpsModel.js");

const headers = {
    'Token': generatePaysprintJWT(),
    'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
}

const generateReferenceId = () => {
    const timestamp = Date.now().toString(36); // Short base36 timestamp
    const randomStr = Math.random().toString(36).substring(2, 8); // Random string
    return `REF-${timestamp}-${randomStr}`.toUpperCase();
};

exports.hlrCheck = async (req, res, next) => {
    const { number, type } = req.body;
    try {
        const apiUrl = "https://sit.paysprint.in/service-api/api/v1/service/recharge/hlrapi/hlrcheck";
        const requestData = {
            number,
            type
        };
        const response = await axios.post(apiUrl, requestData, { headers });
        return res.status(200).json({
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};
exports.browsePlan = async (req, res, next) => {
    const { circle, op } = req.query;
    try {
        const apiUrl = "https://sit.paysprint.in/service-api/api/v1/service/recharge/hlrapi/browseplan";
        const requestData = {
            circle,
            op
        };
        const response = await axios.post(apiUrl, requestData, { headers });
        return res.status(200).json({
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

exports.getOperatorList = async (req, res, next) => {
    try {
        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/recharge/recharge/getoperator",
            {},
            { headers }
        );

        if (response.data?.response_code === 1) {
            // Store operators in memory for this request cycle (optional)
            req.operators = response.data.data;

            return res.status(200).json({
                status: "success",
                message: "Operator List Fetched",
                data: response.data.data,
            });
        } else {
            return res.status(200).json({
                status: "success",
                message: "No Operator Found",
                data: []
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.doRecharge = async (req, res, next) => {
    const { operator: operatorName, canumber, amount, category } = req.body;
    const userId = req.user.id;
    const referenceid = generateReferenceId();

    try {
        const operatorResponse = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/recharge/recharge/getoperator",
            {},
            { headers }
        );
        console.log("Operator Response:", operatorResponse.data);
        if (operatorResponse.data?.responsecode !== 1) {
            return res.status(400).json({
                status: "fail",
                message: "Could not verify operator"
            });
        }

        const operator = operatorResponse.data.data.find(
            op => op.name.toLowerCase() === operatorName.toLowerCase()
        );

        if (!operator) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid operator name"
            });
        }

        const operatorId = operator.id;

        const rechargeRecord = new BbpsHistory({
            userId,
            rechargeType: category,
            operator: operatorId,
            operatorName: operatorName,
            customerNumber: canumber,
            amount,
            transactionId: referenceid,
        });

        await rechargeRecord.save();

        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/recharge/recharge/dorecharge",
            {
                operator: operatorId,
                canumber,
                amount,
                referenceid,
            },
            { headers }
        );

        const resData = response.data;
        let status, message;

        switch (resData.response_code) {
            case 1:
                status = "Success";
                message = resData.message || "Recharge successful";
                break;
            case 2:
            case 0:
                status = "Requery";
                message = resData.message || "Please requery after 30 min";
                break;
            default:
                status = "Failed";
                message = resData.message || "Recharge failed";
        }

        rechargeRecord.status = status;
        await rechargeRecord.save();

        return res.status(resData.response_code === 1 ? 200 : 400).json({
            status: status.toLowerCase(),
            message,
            data: resData,
        });

    } catch (error) {
        await BbpsHistory.findOneAndUpdate(
            { transactionId: referenceid },
            { $set: { status: "Failed" } }
        );
        console.log(error.message)
        next(error);
    }
};

exports.checkRechargeStatus = async (req, res, next) => {
    const { transactionId } = req.params;

    try {
        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/recharge/recharge/status",
            {
                referenceid: transactionId,
            },
            { headers }
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
        next(error);
    }
};