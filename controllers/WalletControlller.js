const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel.js');
const User = require('../models/userModel.js');
const { parse } = require('json2csv');
const mainWallet = require('../models/mainWalletModel.js');

exports.getWalletTransactions = async (req, res) => {
  try {
    const {
      keyword,
      transaction_type,
      status,
      payment_mode,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      exportCsv = 'false'
    } = req.query;

    const userId = req.user.role == "Admin" ? req.query.userId : req.user?.id;

    const match = {};

    if (keyword) {
      match.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { transaction_reference_id: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (userId) match.user_id = new mongoose.Types.ObjectId(userId);
    if (transaction_type) match.transaction_type = transaction_type;
    if (status) match.status = status;
    if (payment_mode) match.payment_mode = payment_mode;

    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          user_id: 1,
          userName: '$user.name',
          transaction_type: 1,
          amount: 1,
          balance_after: 1,
          status: 1,
          payment_mode: 1,
          transaction_reference_id: 1,
          description: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    if (exportCsv !== 'true') {
      pipeline.push(
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      );
    }

    const transactions = await Transaction.aggregate(pipeline);

    if (exportCsv === 'true') {
      const fields = [
        '_id',
        'user_id',
        'userName',
        'transaction_type',
        'amount',
        'balance_after',
        'status',
        'payment_mode',
        'transaction_reference_id',
        'description',
        'createdAt'
      ];
      const csv = parse(transactions, { fields });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv);
    }

    const totalPipeline = [
      { $match: match },
      { $count: 'total' }
    ];
    const totalResult = await Transaction.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createWalletTransaction = async (req, res) => {
  try {
    const {
      user_id,
      transaction_type,
      amount,
      status = 'pending',
      payment_mode,
      transaction_reference_id,
      description
    } = req.body;

    if (!user_id || !transaction_type || amount == null) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let newBalance = user.eWallet || 0;
    if (transaction_type === 'credit') {
      newBalance += amount;
    } else if (transaction_type === 'debit') {
      if (newBalance < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      newBalance -= amount;
    }

    user.eWallet = newBalance;
    await user.save();

    const transaction = await Transaction.create({
      user_id,
      transaction_type,
      amount,
      balance_after: newBalance,
      status,
      payment_mode,
      transaction_reference_id,
      description
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMainWalletTransactions = async (req, res) => {
  try {
    const {
      keyword,
      transaction_type,
      status,
      payment_mode,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      exportCsv = 'false'
    } = req.query;

    const userId = req.user.role == "Admin" ? req.query.userId : req.user?.id;

    const match = {};

    if (keyword) {
      match.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { transaction_reference_id: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (userId) match.user_id = new mongoose.Types.ObjectId(userId);
    if (transaction_type) match.transaction_type = transaction_type;
    if (status) match.status = status;
    if (payment_mode) match.payment_mode = payment_mode;

    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          user_id: 1,
          userName: '$user.name',
          transaction_type: 1,
          amount: 1,
          balance_after: 1,
          status: 1,
          payment_mode: 1,
          transaction_id: 1,
          description: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    if (exportCsv !== 'true') {
      pipeline.push(
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      );
    }

    const transactions = await mainWallet.aggregate(pipeline);

    if (exportCsv === 'true') {
      const fields = [
        '_id',
        'user_id',
        'userName',
        'transaction_type',
        'amount',
        'balance_after',
        'status',
        'payment_mode',
        'transaction_id',
        'description',
        'createdAt'
      ];
      const csv = parse(transactions, { fields });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv);
    }

    const totalPipeline = [
      { $match: match },
      { $count: 'total' }
    ];
    const totalResult = await mainWallet.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.transferToEwallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { amount, mpin } = req.body;

    if (!amount || !mpin) {
      return res.status(400).json({ success: false, message: 'Amount and MPIN are required.' });
    }

    const user = await User.findById(userId).session(session);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });


    if (user.mainWallet < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance in Main Wallet.' });
    }

    user.mainWallet -= amount;
    user.eWallet += amount;
    await user.save({ session });

    const reference = `MW2EW-${Date.now()}`;

    await mainWallet.create([{
      user_id: user._id,
      transaction_type: 'debit',
      amount,
      balance_after: user.mainWallet,
      status: 'Success',
      payment_mode: 'wallet',
      transaction_id: reference,
      description: `Transfer to eWallet with transation id ${reference}`,
      meta: { type: 'main-to-ewallet' }
    }], { session });

    await Transaction.create([{
      user_id: user._id,
      transaction_type: 'credit',
      amount,
      balance_after: user.eWallet,
      status: 'Success',
      payment_mode: 'wallet',
      transaction_reference_id: reference,
      description: `Received from Main Wallet with transation id ${reference}`,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Amount transferred to eWallet successfully.',
      reference
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};

const CHARGE_TYPE = 'percentage';
const CHARGE_VALUE = 1.5;

exports.ewalletToMainTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { amount, mpin } = req.body;

    if (!amount || !mpin) {
      return res.status(400).json({ success: false, message: 'Amount and MPIN are required.' });
    }

    const user = await User.findById(userId).session(session);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMpinValid = (mpin === user.mpin);
    if (!isMpinValid) {
      return res.status(401).json({ success: false, message: 'Invalid MPIN' });
    }

    const charge = CHARGE_TYPE === 'flat'
      ? CHARGE_VALUE
      : (amount * CHARGE_VALUE) / 100;

    const totalDebit = amount + charge;

    if (user.eWallet < totalDebit) {
      return res.status(400).json({ success: false, message: 'Insufficient balance in eWallet.' });
    }

    const reference = `EW2MW-${Date.now()}`;

    user.eWallet -= totalDebit;
    user.mainWallet += amount;
    await user.save({ session });

    await Transaction.create([
      {
        user_id: user._id,
        transaction_type: 'debit',
        amount: user.eWallet - totalDebit,
        balance_after: user.eWallet,
        status: 'Success',
        payment_mode: 'wallet',
        transaction_reference_id: reference,
        description: `Transferred to Main Wallet with txnid ${reference}`
      }
    ], { session });

    await mainWallet.create([{
      user_id: user._id,
      transaction_type: 'credit',
      amount: user.mainWallet - amount,
      balance_after: user.mainWallet,
      status: 'Success',
      payment_mode: 'wallet',
      transaction_id: reference,
      description: `Received from eWallet with txnId ${reference}`
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Amount transferred to Main Wallet successfully.'
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};
