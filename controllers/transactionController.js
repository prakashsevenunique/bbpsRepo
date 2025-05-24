const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");



const getTransactionDetail = async(req, res)=>{
    const {userId, transaction_type, amount, balance_after, status, payment_mode} = req.body;
    
}


