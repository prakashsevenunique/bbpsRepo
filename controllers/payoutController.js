const User = require("../models/userModel.js");
const mongoose = require("mongoose");
const axios = require("axios");
const PayOut = require("../models/payOutModel.js");


exports.getPayOuts = async (req, res) => {
  try {
    const {
      keyword,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      exportCsv = 'false'
    } = req.query;

    const match = {};
    const userId = req.user.role == "Admin" ? req.query.userId : req.user?.id;

    if (keyword) {
      match.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { mobile: keyword },
        { reference: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (userId) match.user_id = new mongoose.Types.ObjectId(userId);

    if (status) match.status = status;

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
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          name: 1,
          email: 1,
          mobile: 1,
          amount: 1,
          afterAmount: 1,
          charges: 1,
          reference: 1,
          trans_mode: 1,
          account: 1,
          ifsc: 1,
          utr: 1,
          status: 1,
          remark: 1,
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

    const payOuts = await PayOut.aggregate(pipeline);

    if (exportCsv === 'true') {
      const fields = [
        '_id',
        'userId',
        'userName',
        'userEmail',
        'name',
        'email',
        'mobile',
        'amount',
        'afterAmount',
        'charges',
        'reference',
        'trans_mode',
        'account',
        'ifsc',
        'utr',
        'status',
        'remark',
        'createdAt'
      ];
      const csv = parse(payOuts, { fields });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=payouts.csv');
      return res.send(csv);
    }

    const totalPipeline = [{ $match: match }, { $count: 'total' }];
    const totalResult = await PayOut.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: payOuts,
      pagination: {
        currentPage: parseInt(page),
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

exports.generatePayOut = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, reference, account, trans_mode, ifsc, name, mobile, email } = req.body;

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const user = await User.findById(userId).session(session);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if ((user.mainWallet + user.cappingMoney) < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance.",
      });
    }

    user.mainWallet -= amount;
    await user.save({ session });

    const payOutData = await axios.post(
      "https://api.worldpayme.com/api/v1.1/payoutTransaction",
      {
        amount: amount,
        reference: reference,
        trans_mode: trans_mode,
        account: account,
        ifsc: ifsc,
        name: name,
        email: email,
        mobile: mobile
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI4IiwianRpIjoiOTcwY2YwZTE1NjcxMGIwZDQ3ZWZlOWY0ZWNjYmJkZDMxNjhmNWMxODc3MzE4ZTgwNzdmNmVmNTczOTZlZDIyNjkwNTZiOWNiZTFmNTBlMjEiLCJpYXQiOjE3NDA5NzgxMzkuOTk5MjM0LCJuYmYiOjE3NDA5NzgxMzkuOTk5MjM1LCJleHAiOjE3NzI1MTQxMzkuOTk2NjgxLCJzdWIiOiIyMzciLCJzY29wZXMiOltdfQ.lakPf6sw_uhlkeLzX0iWt3YAkeC4lJd-lici6uc_of4EIEJjMakV9xr77rv35jpNbw2QYDWpVbtNYMZeAWIaX5T9TnbPtI0_J0yyUr6WoKmNtV6xjCU5rJz-QGuLgvg-uurNxsWXW2mo3j3t202fvZPsCdY0PzLlWzDiLQJ8DjKIK10oLagBR7WANafjNujtX84A9wy9xYX1LDNwQtI6d6EjMg4TKwt3MazawXh57TjFC7X4bYMlSNshvCXICMSEQ8z_20GZqBAXtjguPjAmzpgVMD7hcMn4iGLP4Oqfo0hD36xvcszWk62IxsBlNHzwf9SJ6tEqWjJKZ7m36uOT79UEXJXQiPkguqbKZ2G3nQu8HN4rm0ccOFqnqKloNaDQJtbVn9N0PPN_ho_RqrNhA02Ut-BdTWbH8-y2DCQNHJeuf8Iee0f934dlnZPaNC76RHhgyKmsc2eaSmpEr9SGe6P-4BJ-pIJkkyl7xHCT4pu2t9Elt7lpjQW_BwztEZ8SJQNQVkv5hvXrtC-KAdnJ7ZAzMPxmCjSaFRgMGLnHr_iQiS8rTgfQFGBXSK4NXXVClaf0-EFoYIVIWUkhgoDMDJKmcjCDLPxOyjOfGy8Ha3oHvMzalEcLGX13f8a4EzzGPcZ3ZSfo3iqbBTNeFkgMr-39I5d9L5iAGYNz4wFiKA8`,
        },
      }
    );
    if (payOutData.status !== 200) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Failed to create payout transaction.",
      });
    }

    const newPayOut = new PayOut({
      userId: new mongoose.Types.ObjectId(req.user.id),
      amount,
      reference,
      account,
      trans_mode: trans_mode || 'IMPS',
      ifsc,
      name,
      mobile,
      email
    });

    await newPayOut.save({ session });
    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({
      success: true,
      message: "Payout request created successfully.",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.callbackPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = req.body;

    const payout = await PayOut.findOne({ reference: data.reference }).session(session);
    if (!payout || payout.status != "Pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found or already proceed" });
    }
    if (data.status === "Success") {
      payout.status = "Success";
      payout.reference = data.txn_id;
      payout.utr = data.utr;
      await payout.save({ session });

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: "Payout successful" });
    }

    payout.status = "Failed";
    await payout.save({ session });

    const user = await User.findById(payout.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    user.mainWallet += payout.amount;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      message: "Ok"
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Something went wrong" });
  }
};

exports.getPayoutStatus = async (req, res) => {
  try {
    const { reference } = req.params;

    const payout = await PayOut.findOne({ reference });

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reference: payout.reference,
        status: payout.status,
        amount: payout.amount,
        userId: payout.userId,
        txn_id: payout.txn_id,
        createdAt: payout.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching payout status:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
