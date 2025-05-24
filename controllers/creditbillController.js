const {rechargeValidation,rechargeviewbill, recharge} = require("../services/creditbillService");

const validate = async (req, res) => {
    const { uid, password, amt, cir, cn, op, adParams } = req.body;

    try {
        // Validate request body if necessary
        if (!uid || !password || !amt || !cir || !cn || !op) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Call service to handle recharge logic
        const response = await rechargeValidation({uid, password, amt, cir, cn, op, adParams});

        // Return the response
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error in recharge:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const viewbill = async (req, res) => {
    const { uid, password, encrypted_card, mobile, last4} = req.body;

    try {
        // Validate request body if necessary
        if (!uid || !password || !encrypted_card || !mobile || !last4 ) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Call service to handle recharge logic
        const response = await rechargeviewbill({uid, password, mobile, last4, encrypted_card});
        //console.log("first", response);
        // Return the response
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error in recharge:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const initiateRecharge = async (req, res) => {
    const { uid, pwd, cn, op, cir, amt, reqid, ad9 } = req.body;

    if (!uid || !pwd || !cn || !op || !cir || !amt || !reqid) {
        return res.status(400).json({ error: 'Missing required query parameters' });
    }

    try {
        const response = await recharge(uid, pwd, cn, op, cir, amt, reqid, ad9);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error during recharge:', error);
        return res.status(500).json({ error: 'Failed to process the recharge request' });
    }
};


module.exports = { validate,viewbill, initiateRecharge};